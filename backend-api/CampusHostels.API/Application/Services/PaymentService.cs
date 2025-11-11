using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _db;

    public PaymentService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount)
    {
        // Validate tenancy exists
        var tenancy = await _db.TenancyAgreements.FindAsync(tenancyId);
        if (tenancy is null)
        {
            throw new InvalidOperationException($"Tenancy {tenancyId} not found.");
        }

        // Create payment record with pending status
        var payment = new Payment
        {
            TenancyAgreementId = tenancyId,
            Amount = (int)amount,
            Status = PaymentStatus.Pending,
            Reference = Guid.NewGuid().ToString("N").Substring(0, 16), // Placeholder reference
            CreatedAt = DateTime.UtcNow
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        // In a real implementation, call the payment gateway (Paystack) here
        // and return the actual authorization URL from the gateway.
        // For now, return a placeholder.
        var authUrl = $"https://checkout.paystack.com/placeholder-{payment.Reference}";

        return (payment.Reference, authUrl);
    }

    public async Task<Payment> VerifyPaymentAsync(string reference)
    {
        // Find payment by reference
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.Reference == reference);
        if (payment is null)
        {
            throw new InvalidOperationException($"Payment with reference {reference} not found.");
        }

        // In a real implementation, verify with the payment gateway (Paystack)
        // For now, mark as paid (dev/test only)
        payment.Status = PaymentStatus.Success;

        // Update or create PaymentSummary
        var summary = await _db.PaymentSummaries
            .FirstOrDefaultAsync(s => s.TenancyAgreementId == payment.TenancyAgreementId);

        if (summary is null)
        {
            summary = new PaymentSummary
            {
                TenancyAgreementId = payment.TenancyAgreementId ?? 0,
                TotalAmountPaid = payment.Amount,
                LastPaymentDate = DateTime.UtcNow,
                AmountLeft = 0 // This would be calculated from tenancy rent - total paid
            };
            _db.PaymentSummaries.Add(summary);
        }
        else
        {
            summary.TotalAmountPaid += payment.Amount;
            summary.LastPaymentDate = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return payment;
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByTenancyAsync(int tenancyId)
    {
        return await _db.Payments
            .Where(p => p.TenancyAgreementId == tenancyId)
            .ToListAsync();
    }

    public Task<Payment?> GetPaymentByIdAsync(int id) => _db.Payments.FindAsync(id).AsTask();
}
