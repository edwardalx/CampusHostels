using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _db;

    public PaymentService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(string Reference, string AuthorizationUrl)>
        InitializePaymentAsync(int tenancyId, decimal amount)
    {
        // 1. Validate tenancy
        var tenancy = await _db.TenancyAgreements
            .Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == tenancyId);

        if (tenancy is null)
            throw new InvalidOperationException($"Tenancy {tenancyId} not found.");

        if (amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.");

        // 2. Generate payment reference
        var reference = $"PAY-{Guid.NewGuid():N}".Substring(0, 18);

        // 3. Create payment (Pending)
        var payment = new Payment
        {
            TenancyAgreementId = tenancyId,
            Amount = amount,
            Reference = reference,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // 4. Call payment gateway (Paystack goes here)
        // var authUrl = await _paystack.InitializePayment(reference, amount, email);

        // Placeholder authorization URL
        var authorizationUrl =
            $"https://checkout.paystack.com/{reference}";

        return (reference, authorizationUrl);
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

        // 2. Verify with gateway (Paystack webhook / verify endpoint)
        // bool isValid = await _paystack.VerifyPayment(reference);

        var isValid = true; // Dev only

        if (!isValid)
        {
            payment.Status = PaymentStatus.Failed;
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
