using System.ComponentModel.DataAnnotations;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Application.DTOs;

public class MaintenanceCreateDto
{
    [Required]
    public int TenancyAgreementId { get; set; }

    [Required]
    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Other;

    [Required, StringLength(120, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(2000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;
}

public class MaintenanceStatusUpdateDto
{
    [Required]
    public MaintenanceStatus Status { get; set; }
}

/// <summary>A tenancy the tenant can currently raise a request against.</summary>
public class MaintenanceTenancyOptionDto
{
    public int TenancyAgreementId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string? RoomNumber { get; set; }
}

/// <summary>What a tenant sees about their own request.</summary>
public class MyMaintenanceRequestDto
{
    public int Id { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public string? RoomNumber { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

/// <summary>What a manager sees in the admin Maintenance tab.</summary>
public class ManagedMaintenanceRequestDto : MyMaintenanceRequestDto
{
    public int PropertyId { get; set; }
    public Guid? OwnerManagerId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}

public class MaintenanceSummaryDto
{
    public int Open { get; set; }
    public int InProgress { get; set; }
    public int Resolved { get; set; }
}

public class ManagedMaintenanceResponseDto : PagedResponseDto
{
    /// <summary>Counts for the whole scope (ignoring the status filter), not just this page.</summary>
    public MaintenanceSummaryDto Summary { get; set; } = new();
    public List<ManagedMaintenanceRequestDto> Items { get; set; } = [];
}
