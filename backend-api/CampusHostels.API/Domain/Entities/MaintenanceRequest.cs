using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Domain.Entities;

/// <summary>A maintenance concern raised by a tenant against their own tenancy.</summary>
public class MaintenanceRequest
{
    public int Id { get; set; }

    /// <summary>The tenant (User.TenantId) who raised the request.</summary>
    public Guid TenantId { get; set; }
    public User? User { get; set; }

    public int TenancyAgreementId { get; set; }
    public TenancyAgreement? TenancyAgreement { get; set; }

    // Denormalised from the tenancy so requests can be scoped to a property owner cheaply.
    public int PropertyId { get; set; }
    public Property? Property { get; set; }
    public int UnitId { get; set; }
    public Unit? Unit { get; set; }

    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Other;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
