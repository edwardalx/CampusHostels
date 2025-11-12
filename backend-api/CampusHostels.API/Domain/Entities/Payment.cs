using System;

namespace CampusHostels.API.Domain.Entities;

public enum PaymentProvider
{
    Paystack,
    Stripe,
    Manual
}

public enum PaymentStatus
{
    Pending,
    Success,
    Failed
}

public class Payment
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GHS";
    public string? Phone { get; set; }
    public PaymentProvider Provider { get; set; } = PaymentProvider.Paystack;
    public string Reference { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Channel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UnitId { get; set; }
    public Unit? Unit { get; set; }
    public Guid TenantId { get; set; }
    public int? TenancyAgreementId { get; set; }
    public TenancyAgreement? TenancyAgreement { get; set; }
}
