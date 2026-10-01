namespace CampusHostels.API.Application.DTOs;

public static class TenantContractStatus
{
    public const string Active = "Active";
    public const string EndingSoon = "EndingSoon";
    public const string Inactive = "Inactive";
}

public class ManagedTenantDto
{
    public int TenancyId { get; set; }
    public Guid TenantId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public Guid? OwnerManagerId { get; set; }
    public int UnitId { get; set; }
    public string? RoomNumber { get; set; }
    public DateTime ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }

    /// <summary>Active, EndingSoon (active and ends within 3 months) or Inactive.</summary>
    public string Status { get; set; } = TenantContractStatus.Inactive;
}

public class TenantSummaryDto
{
    public int ActiveContracts { get; set; }
    public int EndingSoon { get; set; }
}

public class ManagedTenantsResponseDto : PagedResponseDto
{
    /// <summary>Covers every tenant in scope, not just the current page.</summary>
    public TenantSummaryDto Summary { get; set; } = new();
    public List<ManagedTenantDto> Items { get; set; } = [];
}
