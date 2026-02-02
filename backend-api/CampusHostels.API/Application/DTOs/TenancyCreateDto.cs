using System;

namespace CampusHostels.API.Application.DTOs;

public class TenancyCreateDto
{
    public DateTime ContractStartDate { get; set; }
    public int ContractDurationMonths { get; set; }
    // public Guid TenantId { get; set; }
    public int PropertyId { get; set; }
    public int UnitId { get; set; }
}
