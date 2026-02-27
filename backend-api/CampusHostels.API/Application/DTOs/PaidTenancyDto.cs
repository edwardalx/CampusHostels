namespace CampusHostels.API.Application.DTOs;
public class PaidTenancyDto
{
    public int Id { get; set; }
    public DateTime ContractStartDate { get; set; }
    public int ContractDurationMonths { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public Guid TenantId { get; set; }
    public int PropertyId { get; set; }
    public int UnitId { get; set; }
    public string? PropertyName { get; set; }
    public string? UnitName { get; set; }
    public decimal TotalAmountPaid { get; set; }
}