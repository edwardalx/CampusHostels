using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _db;
    private readonly Application.Interfaces.IPaystackService _paystack;

    public PaymentService(ApplicationDbContext db, Application.Interfaces.IPaystackService paystack)
    {
        _db = db;
        _paystack = paystack;
    }

    public async Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string? callbackUrl, string? phone = null, string? provider = null, int? unitId = null, string currency = "GHS")
    {

        // 1. Validate tenancy
        var tenancy = await _db.TenancyAgreements
            .Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == tenancyId)
            ?? throw new InvalidOperationException($"Tenancy {tenancyId} not found.");

        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.");

        // 2. Generate payment reference
        var reference = $"PAY-{Guid.NewGuid():N}".Substring(0, 18);
        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            callbackUrl = $"http://localhost:5173/payments/receipt/{reference}/";
        }

        // 3. Create payment (Pending)
        var payment = new Payment
        {
            TenancyAgreementId = tenancyId,
            UnitId = tenancy.UnitId,
            Amount = amount,
            TenantId = tenancy.TenantId,
            Channel = provider ?? "unknown",
            Phone = phone ?? throw new InvalidOperationException("Tenant phone number is required."),
            Reference = reference,
            Status = PaymentStatus.Pending,
            Email = customerEmail,      // ← ADD THIS!
            Currency = currency,
            CreatedAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new Exception("Database error while initializing payment: " + ex.InnerException?.Message, ex);
        }

        // 4. Initialize transaction with Paystack to get authorization URL
        try
        {
            var metadata = new
            {
                phone,
                provider,
                unit_id = unitId ?? payment.UnitId,
                tenancy_id = tenancyId
            };

            var (authUrl, paystackRef) = await _paystack.InitializeTransactionAsync(amount, customerEmail, callbackUrl, payment.Reference, currency, metadata);
            // Update local payment.Reference to the reference returned by Paystack (if provided)
            payment.Reference = !string.IsNullOrEmpty(paystackRef) ? paystackRef : payment.Reference;
            await _db.SaveChangesAsync();
            return (payment.Reference, authUrl);
        }
        catch (Exception ex)
        {
            // Leave payment in Pending but surface the error
            throw new Exception("Payment gateway initialization failed: " + ex.Message, ex);
        }
    }

    // Backwards-compatible overload used by tests and older callers
    public Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount)
    {
        // Use placeholders for email and callback; callers using this overload expect a quick local flow (no external callback)
        var defaultEmail = "noreply@campushostels.local";
        var defaultCallback = string.Empty;
        return InitializePaymentAsync(tenancyId, amount, defaultEmail, defaultCallback);
    }

    // Interface-compatible implementation (explicit 4-parameter signature)
    public Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string callbackUrl)
    {
        return InitializePaymentAsync(tenancyId, amount, customerEmail, callbackUrl, null, null, null, "GHS");
    }

    public async Task<Payment> VerifyPaymentAsync(string reference)
    {
        // 1. Find payment
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.Reference == reference);

        if (payment is null)
            throw new InvalidOperationException($"Payment {reference} not found.");

        if (payment.Status == PaymentStatus.Success)
            return payment; // Idempotency safety

        // 2. Verify with gateway (Paystack verify endpoint)
        var (isValid, actualChannel, gatewayResponse) = await _paystack.VerifyTransactionAsync(reference);
        // Update the EXISTING payment with channel info
        if (!string.IsNullOrEmpty(actualChannel))
        {
            payment.Channel = actualChannel; // Update with actual payment channel used
        }

        if (!isValid)
        {
            payment.Status = PaymentStatus.Failed;
            payment.PaidAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return payment;
        }

        // 3. Mark payment as successful
        payment.Status = PaymentStatus.Success;
        payment.PaidAt = DateTime.UtcNow;

        // 4. Update payment summary
        var tenancy = await _db.TenancyAgreements
            .Include(t => t.Unit)
            .FirstAsync(t => t.Id == payment.TenancyAgreementId);

        var totalRent = tenancy.Unit?.Cost ?? 0m;

        var summary = await _db.PaymentSummaries
            .FirstOrDefaultAsync(s => s.TenancyAgreementId == tenancy.Id);

        if (summary is null)
        {
            summary = new PaymentSummary
            {
                TenancyAgreementId = tenancy.Id,
                TotalAmountPaid = payment.Amount,
                LastPaymentDate = DateTime.UtcNow
            };

            _db.PaymentSummaries.Add(summary);
        }
        else
        {
            summary.TotalAmountPaid += payment.Amount;
            summary.LastPaymentDate = DateTime.UtcNow;
        }

        summary.AmountLeft = Math.Max(
            totalRent - summary.TotalAmountPaid,
            0m
        );

        await _db.SaveChangesAsync();
        return payment;
    }

    public async Task<IEnumerable<Payment>>
        GetPaymentsByTenancyAsync(int tenancyId)
    {
        return await _db.Payments
            .Where(p => p.TenancyAgreementId == tenancyId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment?>
        GetPaymentByIdAsync(int id)
    {
        return await _db.Payments.FindAsync(id);
    }
}
