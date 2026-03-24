using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _db;
    private readonly IPaystackService _paystack;
    private readonly ITenancyRepository _repo;
    private readonly string _baseUrl;


    public PaymentService(ApplicationDbContext db, IPaystackService paystack, IConfiguration config, ITenancyRepository repo)
    {
        _db = db;
        _repo = repo;
        _paystack = paystack;

        _baseUrl = config["App:BaseUrl"]
        ?? throw new Exception("App BaseUrl not configured");
    }

    // ------------------------------
    // Main DTO-based Initialize
    // ------------------------------
    public async Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(InitializePaymentRequest request)
    {
        // 1️⃣ Validate tenancy
        var tenancy = await _db.TenancyAgreements
            .Include(t => t.Unit)
            .FirstOrDefaultAsync(t => t.Id == request.TenancyId)
            ?? throw new InvalidOperationException($"Tenancy {request.TenancyId} not found.");

        if (request.Amount <= 0)
            throw new ArgumentException("Payment amount must be greater than zero.");

        if (request.UnitId != null && request.UnitId != tenancy.UnitId)
            throw new InvalidOperationException("Unit ID is not valid for this tenancy.");

        // 2️⃣ Validate tenant
        var tenant = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenancy.TenantId)
            ?? throw new InvalidOperationException($"Tenant {tenancy.TenantId} not found.");

        if (tenant.Email != request.Email)
            throw new ArgumentException("Customer email does not match tenant email on record.");

        if (tenant.PhoneNumber != request.Phone)
            throw new ArgumentException("Customer Phone number does not match tenant email on record.");

        // 3️⃣ Generate reference
        var reference = $"PAY-{Guid.NewGuid():N}".Substring(0, 18);
        if (string.IsNullOrWhiteSpace(request.CallbackUrl))
        {
            request.CallbackUrl = $"{_baseUrl}/payments/receipt/{reference}";
        }

        // 4️⃣ Create Payment entity
        var payment = new Payment
        {
            TenancyAgreementId = request.TenancyId,
            UnitId = tenancy.UnitId,
            Amount = request.Amount,
            TenantId = tenancy.TenantId,
            Channel = request.Provider?.ToString() ?? "unknown",
            Phone = request.Phone ?? throw new InvalidOperationException("Tenant phone number is required."),
            Reference = reference,
            Status = PaymentStatus.Pending,
            Email = request.Email,
            Currency = request.Currency,
            CreatedAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // 5️⃣ Initialize Paystack transaction
        var metadata = new
        {
            phone = request.Phone,
            provider = request.Provider,
            unit_id = request.UnitId ?? payment.UnitId,
            tenancy_id = request.TenancyId
        };

        var (authUrl, paystackRef) = await _paystack.InitializeTransactionAsync(
            request.Amount,
            request.Email,
            request.CallbackUrl,
            payment.Reference,
            request.Currency,
            metadata
        );

        payment.Reference = !string.IsNullOrEmpty(paystackRef) ? paystackRef : payment.Reference;
        await _db.SaveChangesAsync();

        return (payment.Reference, authUrl);
    }

    // ------------------------------
    // Interface Overloads (backwards-compatible)
    // ------------------------------
    public Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount)
    {
        var request = new InitializePaymentRequest
        {
            TenancyId = tenancyId,
            Amount = amount,
            Email = "noreply@campushostels.local",
            CallbackUrl = string.Empty,
            Phone = "0000000000",
            Currency = "GHS",
            Provider = PaymentProvider.Paystack
        };

        return InitializePaymentAsync(request);
    }

    public Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string callbackUrl)
    {
        var request = new InitializePaymentRequest
        {
            TenancyId = tenancyId,
            Amount = amount,
            Email = customerEmail,
            CallbackUrl = callbackUrl,
            Phone = "0000000000",
            Currency = "GHS",
            Provider = PaymentProvider.Paystack
        };

        return InitializePaymentAsync(request);
    }

    public async Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string? callbackUrl, string? phone = null, string? provider = null, int? unitId = null, string currency = "GHS")
    {
        var request = new InitializePaymentRequest
        {
            TenancyId = tenancyId,
            Amount = amount,
            Email = customerEmail,
            CallbackUrl = callbackUrl,
            Phone = phone ?? "0000000000",
            Provider = !string.IsNullOrEmpty(provider) ? Enum.Parse<PaymentProvider>(provider) : PaymentProvider.Paystack,
            UnitId = unitId,
            Currency = currency
        };

        return await InitializePaymentAsync(request);
    }

    // ------------------------------
    // Payment Verification
    // ------------------------------
    public async Task<PaymentDto> VerifyPaymentAsync(string reference)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.Reference == reference)
            ?? throw new InvalidOperationException($"Payment {reference} not found.");

        var dto = MapToDto(payment);

        if (payment.Status == PaymentStatus.Success)
        {
            return dto;
        }

        var (isValid, actualChannel, _) = await _paystack.VerifyTransactionAsync(reference);

        if (!string.IsNullOrEmpty(actualChannel))
            payment.Channel = actualChannel;

        if (!isValid)
        {
            payment.Status = PaymentStatus.Failed;
            payment.PaidAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return dto;
        }

        payment.Status = PaymentStatus.Success;
        payment.PaidAt = DateTime.UtcNow;

        var tenancy = await _db.TenancyAgreements.Include(t => t.Unit).FirstAsync(t => t.Id == payment.TenancyAgreementId);
        var tenancies = await _repo.GetActiveTenanciesByUnitAsync(tenancy.Unit!.PropertyId,tenancy.UnitId);
        tenancy.TotalAmountPaid = (tenancy.TotalAmountPaid ?? 0m) + payment.Amount;
        tenancy.IsActive = true;
        var activeTenants = tenancies.Count(t => t.ContractEndDate >= DateTime.UtcNow && t.TotalAmountPaid != null);
        tenancy.Unit!.Availability = activeTenants < tenancy.Unit?.MaxNoOfPeople;
        if (tenancy.Unit != null)
        {
            tenancy.Unit.BedsLeft = tenancy.Unit.MaxNoOfPeople - activeTenants;
        }
        var totalRent = tenancy.Unit?.Cost ?? 0m;

        var summary = await _db.PaymentSummaries.FirstOrDefaultAsync(s => s.TenancyAgreementId == tenancy.Id);
        if (summary == null)
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

        summary.AmountLeft = Math.Max(totalRent - summary.TotalAmountPaid, 0m);


        await _db.SaveChangesAsync();

        return dto;
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByTenancyAsync(int tenancyId)
    {
        return await _db.Payments
            .Where(p => p.TenancyAgreementId == tenancyId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment?> GetPaymentByIdAsync(int id)
    {
        return await _db.Payments.FindAsync(id);
    }
    public async Task<IEnumerable<PaymentDto>> GetPaymentsByTenantAsync(Guid tenantId)
    {
        return await _db.Payments
            .Where(p => p.TenantId == tenantId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                Amount = p.Amount,
                Reference = p.Reference,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt,
                Status = p.Status.ToString(),
                Channel = p.Channel,
                Currency = p.Currency
            })
            .ToListAsync();
    }
    private PaymentDto MapToDto(Payment payment)
    {
        return new PaymentDto
        {
            Id = payment.Id,
            Amount = payment.Amount,
            Reference = payment.Reference,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt,
            Status = payment.Status.ToString(),
            Channel = payment.Channel,
            Currency = payment.Currency
        };
    }
}
