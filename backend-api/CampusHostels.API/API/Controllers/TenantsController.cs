using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private const int EndingSoonMonths = 3;

    private readonly ApplicationDbContext _db;
    private readonly IManagerService _managerService;

    public TenantsController(ApplicationDbContext db, IManagerService managerService)
    {
        _db = db;
        _managerService = managerService;
    }

    /// <summary>
    /// Lists tenants (one row per tenancy). Super managers see every tenant and may filter by
    /// property owner; other managers see only tenants in properties they own.
    /// </summary>
    /// <param name="ownerId">Super managers only: restrict to properties owned by this manager.</param>
    /// <param name="sortBy">"name" (default) or "startDate".</param>
    /// <param name="sortDir">"asc" (default) or "desc".</param>
    /// <param name="page">1-based page number (default 1).</param>
    /// <param name="pageSize">Rows per page (default 25, max 100).</param>
    [Authorize(Policy = "RequireManager")]
    [HttpGet]
    public async Task<IActionResult> GetManaged(
        [FromQuery] Guid? ownerId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = Paging.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            return Unauthorized();
        }

        if (!await _managerService.CanManageUsersAsync(managerId))
        {
            return Forbid();
        }

        if (page < 1 || pageSize < 1 || pageSize > Paging.MaxPageSize)
        {
            return BadRequest(new { error = $"page must be at least 1 and pageSize between 1 and {Paging.MaxPageSize}." });
        }

        var sortByStartDate = false;
        if (sortBy is not null)
        {
            if (sortBy.Equals("startDate", StringComparison.OrdinalIgnoreCase)) sortByStartDate = true;
            else if (!sortBy.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "sortBy must be 'name' or 'startDate'." });
            }
        }

        var descending = false;
        if (sortDir is not null)
        {
            if (sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase)) descending = true;
            else if (!sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "sortDir must be 'asc' or 'desc'." });
            }
        }

        var isSuperManager = User.HasClaim("managerTier", "Super");
        if (ownerId.HasValue && !isSuperManager)
        {
            return Forbid();
        }

        var tenancies = _db.TenancyAgreements
            .AsNoTracking()
            .Where(tenancy => tenancy.User != null && tenancy.Property != null && tenancy.Unit != null)
            .Where(tenancy => isSuperManager || tenancy.Property!.OwnerManagerId == managerId)
            .Where(tenancy => ownerId == null || tenancy.Property!.OwnerManagerId == ownerId);

        var ordered = (sortByStartDate, descending) switch
        {
            (true, false) => tenancies.OrderBy(t => t.ContractStartDate).ThenBy(t => t.User!.LastName).ThenBy(t => t.User!.FirstName),
            (true, true) => tenancies.OrderByDescending(t => t.ContractStartDate).ThenBy(t => t.User!.LastName).ThenBy(t => t.User!.FirstName),
            (false, false) => tenancies.OrderBy(t => t.User!.FirstName).ThenBy(t => t.User!.LastName).ThenBy(t => t.ContractStartDate),
            (false, true) => tenancies.OrderByDescending(t => t.User!.FirstName).ThenByDescending(t => t.User!.LastName).ThenBy(t => t.ContractStartDate),
        };

        // "Active" uses the same definition as the dashboard: a paid, active tenancy whose dates cover today.
        var now = DateTime.UtcNow;
        var today = now.Date;
        var endingSoonCutoff = today.AddMonths(EndingSoonMonths);

        var active = tenancies.Where(t => t.IsActive
            && t.TotalAmountPaid != null
            && t.ContractStartDate <= now
            && (t.ContractEndDate == null || t.ContractEndDate >= today));

        // Counts run in the database over the whole scope, so they stay correct when paging.
        var totalCount = await tenancies.CountAsync(cancellationToken);
        var activeContracts = await active.CountAsync(cancellationToken);
        var endingSoon = await active.CountAsync(
            t => t.ContractEndDate != null && t.ContractEndDate <= endingSoonCutoff, cancellationToken);

        var rows = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.TenantId,
                t.User!.FirstName,
                t.User.LastName,
                t.User.Email,
                t.User.PhoneNumber,
                t.PropertyId,
                PropertyName = t.Property!.Name,
                t.Property.OwnerManagerId,
                t.UnitId,
                t.Unit!.RoomNumber,
                t.ContractStartDate,
                t.ContractEndDate,
                t.IsActive,
                HasPaid = t.TotalAmountPaid != null
            })
            .ToListAsync(cancellationToken);

        var items = rows.Select(row =>
        {
            var isActiveContract = row.IsActive
                && row.HasPaid
                && row.ContractStartDate <= now
                && (row.ContractEndDate == null || row.ContractEndDate >= today);
            var status = !isActiveContract
                ? TenantContractStatus.Inactive
                : row.ContractEndDate != null && row.ContractEndDate <= endingSoonCutoff
                    ? TenantContractStatus.EndingSoon
                    : TenantContractStatus.Active;

            return new ManagedTenantDto
            {
                TenancyId = row.Id,
                TenantId = row.TenantId,
                FirstName = row.FirstName,
                LastName = row.LastName,
                Email = row.Email,
                PhoneNumber = row.PhoneNumber,
                PropertyId = row.PropertyId,
                PropertyName = row.PropertyName,
                OwnerManagerId = row.OwnerManagerId,
                UnitId = row.UnitId,
                RoomNumber = row.RoomNumber,
                ContractStartDate = row.ContractStartDate,
                ContractEndDate = row.ContractEndDate,
                Status = status
            };
        }).ToList();

        var tenants = new ManagedTenantsResponseDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Summary = new TenantSummaryDto
            {
                // Ending-soon contracts are still active, so they count towards both figures.
                ActiveContracts = activeContracts,
                EndingSoon = endingSoon
            }
        };

        return Ok(tenants);
    }
}
