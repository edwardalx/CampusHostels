using System;

namespace CampusHostels.API.Domain.Entities;

public class PaymentSummary
{
    public int Id { get; set; }
    public int TenancyAgreementId { get; set; }
    public TenancyAgreement? TenancyAgreement { get; set; }
    public decimal TotalAmountPaid { get; set; }
    public decimal AmountLeft { get; set; }
    public DateTime? LastPaymentDate { get; set; }
}
