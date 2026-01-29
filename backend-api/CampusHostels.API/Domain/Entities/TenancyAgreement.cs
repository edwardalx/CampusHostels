using System;

namespace CampusHostels.API.Domain.Entities;

public class TenancyAgreement
{
    public int Id { get; set; }
    public DateTime ContractStartDate { get; set; }
    public int ContractDurationMonths { get; set; }
    public DateTime? ContractEndDate { get; set; }

    public Guid TenantId { get; set; }
    // optional navigation to User/Tenant stored separately
    public int PropertyId { get; set; }
    public Property? Property { get; set; }
    public int UnitId { get; set; }
    public Unit? Unit { get; set; }

    public decimal? TotalAmountPaid { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public void ComputeContractEndDate()
    {
        if (ContractStartDate == default)
            throw new InvalidOperationException("Contract start date is required.");

        if (ContractDurationMonths <= 0)
            throw new InvalidOperationException("Contract duration must be greater than zero.");

        ContractEndDate = ContractStartDate.AddMonths(ContractDurationMonths);
    }
}
