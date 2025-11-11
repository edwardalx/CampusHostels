using System;

namespace CampusHostels.API.Domain.Entities;

public class PaymentSummary
{
    public int Id { get; set; }
    public int TenancyAgreementId { get; set; }
    public TenancyAgreement? TenancyAgreement { get; set; }
    public int TotalAmountPaid { get; set; }
    public int AmountLeft { get; set; }
    public DateTime? LastPaymentDate { get; set; }
}
