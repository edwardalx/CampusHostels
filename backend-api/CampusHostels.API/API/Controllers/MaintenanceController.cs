using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaintenanceController : ControllerBase
{
    private const int MaxOpenRequestsPerTenant = 10;
    private const int MyRequestsLimit = 50;

    private readonly ApplicationDbContext _db;
    private readonly IManagerActivityNotifier _notifier;

    public MaintenanceController(ApplicationDbContext db, IManagerActivityNotifier notifier)
    {
        _db = db;
        _notifier = notifier;
    }

    // ---------------------------------------------------------------- tenants

    /// <summary>Tenancies the signed-in tenant can currently raise a request against.</summary>
    [Authorize]
    [HttpGet("my-tenancies")]
    public async Task<IActionResult> GetMyTenancies(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId)) return Unauthorized();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var options = await _db.TenancyAgreements
            .AsNoTracking()
            .Where(t => t.TenantId == tenantId
                && t.IsActive
                && t.TotalAmountPaid != null
                && t.ContractStartDate <= now
                && (t.ContractEndDate == null || t.ContractEndDate >= today))
            .OrderByDescending(t => t.ContractStartDate)
            .Select(t => new MaintenanceTenancyOptionDto
            {
                TenancyAgreementId = t.Id,
                PropertyName = t.Property!.Name,
                RoomNumber = t.Unit!.RoomNumber
            })
            .ToListAsync(cancellationToken);

        return Ok(options);
    }

    /// <summary>Raise a maintenance concern against one of the tenant's own current tenancies.</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaintenanceCreateDto dto, CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId)) return Unauthorized();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var tenancy = await _db.TenancyAgreements
            .AsNoTracking()
            .Where(t => t.Id == dto.TenancyAgreementId
                && t.TenantId == tenantId
                && t.IsActive
                && t.TotalAmountPaid != null
                && t.ContractStartDate <= now
                && (t.ContractEndDate == null || t.ContractEndDate >= today))
            .Select(t => new { t.Id, t.PropertyId, t.UnitId })
            .FirstOrDefaultAsync(cancellationToken);

        // Same answer whether the tenancy is missing, someone else's, or no longer current.
        if (tenancy is null)
        {
            return BadRequest(new { error = "Choose one of your current tenancies." });
        }

        var openCount = await _db.MaintenanceRequests.CountAsync(
            r => r.TenantId == tenantId && r.Status != MaintenanceStatus.Resolved, cancellationToken);
        if (openCount >= MaxOpenRequestsPerTenant)
        {
            return BadRequest(new { error = $"You already have {MaxOpenRequestsPerTenant} unresolved requests. Please wait for some to be resolved." });
        }

        var request = new MaintenanceRequest
        {
            TenantId = tenantId,
            TenancyAgreementId = tenancy.Id,
            PropertyId = tenancy.PropertyId,
            UnitId = tenancy.UnitId,
            Category = dto.Category,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim()
        };

        _db.MaintenanceRequests.Add(request);
        await _db.SaveChangesAsync(cancellationToken);

        _notifier.Notify(request.PropertyId, "New maintenance request", $"Category: {request.Category}", "/manager/maintenance");

        return Created($"api/Maintenance/{request.Id}", new { id = request.Id, status = request.Status.ToString() });
    }

    /// <summary>The signed-in tenant's own requests, newest first.</summary>
    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        if (!TryGetTenantId(out var tenantId)) return Unauthorized();

        var items = await _db.MaintenanceRequests
            .AsNoTracking()
            .Where(r => r.TenantId == tenantId)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Take(MyRequestsLimit)
            .Select(r => new MyMaintenanceRequestDto
            {
                Id = r.Id,
                PropertyName = r.Property!.Name,
                RoomNumber = r.Unit!.RoomNumber,
                Category = r.Category.ToString(),
                Title = r.Title,
                Description = r.Description,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                ResolvedAt = r.ResolvedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    // --------------------------------------------------------------- managers

    /// <summary>
    /// Requests for the signed-in manager. Super managers see all and may filter by owner; other
    /// managers see only requests for properties they own.
    /// </summary>
    /// <param name="status">Optional: Open, InProgress or Resolved.</param>
    /// <param name="sortDir">"desc" (default, newest first) or "asc".</param>
    [Authorize(Policy = "RequireManager")]
    [HttpGet("managed")]
    public async Task<IActionResult> GetManaged(
        [FromQuery] Guid? ownerId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? sortDir = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = Paging.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize < 1 || pageSize > Paging.MaxPageSize)
        {
            return BadRequest(new { error = $"page must be at least 1 and pageSize between 1 and {Paging.MaxPageSize}." });
        }

        MaintenanceStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<MaintenanceStatus>(status, ignoreCase: true, out var parsed))
            {
                return BadRequest(new { error = "status must be 'Open', 'InProgress' or 'Resolved'." });
            }
            statusFilter = parsed;
        }

        if (sortDir is not null && !sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase)
            && !sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "sortDir must be 'asc' or 'desc'." });
        }

        if (!TryGetManagerScope(ownerId, out var scopeOwnerId, out var denied)) return denied!;

        var scoped = ScopedRequests(scopeOwnerId, ownerId);

        var open = await scoped.CountAsync(r => r.Status == MaintenanceStatus.Open, cancellationToken);
        var inProgress = await scoped.CountAsync(r => r.Status == MaintenanceStatus.InProgress, cancellationToken);
        var resolved = await scoped.CountAsync(r => r.Status == MaintenanceStatus.Resolved, cancellationToken);

        var filtered = statusFilter is null ? scoped : scoped.Where(r => r.Status == statusFilter);
        var totalCount = statusFilter switch
        {
            MaintenanceStatus.Open => open,
            MaintenanceStatus.InProgress => inProgress,
            MaintenanceStatus.Resolved => resolved,
            _ => open + inProgress + resolved
        };

        var ascending = sortDir is not null && sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase);
        var ordered = ascending
            ? filtered.OrderBy(r => r.CreatedAt).ThenBy(r => r.Id)
            : filtered.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id);

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ManagedMaintenanceRequestDto
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                OwnerManagerId = r.Property!.OwnerManagerId,
                PropertyName = r.Property.Name,
                RoomNumber = r.Unit!.RoomNumber,
                TenantName = r.User != null ? (r.User.FirstName + " " + r.User.LastName).Trim() : "",
                PhoneNumber = r.User != null ? r.User.PhoneNumber : "",
                Email = r.User != null ? r.User.Email : "",
                Category = r.Category.ToString(),
                Title = r.Title,
                Description = r.Description,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                ResolvedAt = r.ResolvedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new ManagedMaintenanceResponseDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Summary = new MaintenanceSummaryDto { Open = open, InProgress = inProgress, Resolved = resolved }
        });
    }

    /// <summary>Move a request through Open, InProgress and Resolved.</summary>
    [Authorize(Policy = "RequireManager")]
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] MaintenanceStatusUpdateDto dto,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(dto.Status))
        {
            return BadRequest(new { error = "status must be 'Open', 'InProgress' or 'Resolved'." });
        }

        if (!TryGetManagerScope(null, out var scopeOwnerId, out var denied)) return denied!;

        // Scoped lookup: a manager cannot update (or even detect) requests for other owners' properties.
        var request = await ScopedRequests(scopeOwnerId, null)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (request is null) return NotFound();

        var now = DateTime.UtcNow;
        request.Status = dto.Status;
        request.UpdatedAt = now;
        request.ResolvedAt = dto.Status == MaintenanceStatus.Resolved ? now : null;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { id = request.Id, status = request.Status.ToString(), updatedAt = request.UpdatedAt });
    }

    // ---------------------------------------------------------------- helpers

    private bool TryGetTenantId(out Guid tenantId) =>
        Guid.TryParse(User.FindFirst("tenantId")?.Value, out tenantId);

    private bool TryGetManagerScope(Guid? requestedOwnerId, out Guid? scopeOwnerId, out IActionResult? denied)
    {
        scopeOwnerId = null;
        denied = null;

        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            denied = Unauthorized();
            return false;
        }

        var isSuperManager = User.HasClaim("managerTier", "Super");
        if (requestedOwnerId.HasValue && !isSuperManager)
        {
            denied = Forbid();
            return false;
        }

        scopeOwnerId = isSuperManager ? null : managerId;
        return true;
    }

    private IQueryable<MaintenanceRequest> ScopedRequests(Guid? scopeOwnerId, Guid? ownerId) =>
        _db.MaintenanceRequests
            .Where(r => scopeOwnerId == null || r.Property!.OwnerManagerId == scopeOwnerId)
            .Where(r => ownerId == null || r.Property!.OwnerManagerId == ownerId);
}
