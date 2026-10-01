using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireManager")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(
        CancellationToken cancellationToken,
        [FromQuery] int[]? selectedPropertyIds = null)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            return Unauthorized();
        }

        var isSuperManager = User.HasClaim("managerTier", "Super");
        var propertyIds = _db.Properties
            .AsNoTracking()
            .Where(property => isSuperManager || property.OwnerManagerId == managerId)
            .Select(property => property.Id);

        if (selectedPropertyIds is { Length: > 0 })
        {
            var requestedIds = selectedPropertyIds.Distinct().ToArray();
            var authorizedCount = await propertyIds
                .Where(propertyId => requestedIds.Contains(propertyId))
                .Distinct()
                .CountAsync(cancellationToken);

            if (authorizedCount != requestedIds.Length)
            {
                return Forbid();
            }

            propertyIds = propertyIds.Where(propertyId => requestedIds.Contains(propertyId));
        }

        var unitIds = _db.Units
            .AsNoTracking()
            .Where(unit => propertyIds.Contains(unit.PropertyId))
            .Select(unit => unit.Id);

        var now = DateTime.UtcNow;
        var today = now.Date;
        var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextYearStart = yearStart.AddYears(1);

        var units = await _db.Units
            .AsNoTracking()
            .Where(unit => unitIds.Contains(unit.Id))
            .Select(unit => new { unit.Id, BedsLeft = unit.BedsLeft ?? 0 })
            .ToListAsync(cancellationToken);
        var totalRooms = units.Count;

        var activeTenancies = _db.TenancyAgreements
            .AsNoTracking()
            .Where(tenancy => unitIds.Contains(tenancy.UnitId)
                && tenancy.IsActive
                && tenancy.TotalAmountPaid != null
                && tenancy.ContractStartDate <= now
                && (tenancy.ContractEndDate == null || tenancy.ContractEndDate >= today));
        var occupiedBedsByUnit = await activeTenancies
            .GroupBy(tenancy => tenancy.UnitId)
            .Select(group => new { UnitId = group.Key, OccupiedBeds = group.Count() })
            .ToDictionaryAsync(result => result.UnitId, result => result.OccupiedBeds, cancellationToken);
        var occupiedRooms = occupiedBedsByUnit.Count;
        var activeTenancyAgreements = occupiedBedsByUnit.Values.Sum();
        var availableBeds = units.Sum(unit => Math.Max(unit.BedsLeft, 0));

        var revenueByCurrency = await _db.Payments
            .AsNoTracking()
            .Where(payment => unitIds.Contains(payment.UnitId)
                && payment.Status == PaymentStatus.Success
                && payment.PaidAt >= yearStart
                && payment.PaidAt < nextYearStart)
            .GroupBy(payment => payment.Currency)
            .Select(group => new { Currency = group.Key, Amount = group.Sum(payment => payment.Amount) })
            .ToDictionaryAsync(result => result.Currency, result => result.Amount, cancellationToken);

        var activeTenanciesNotFullyPaid = await (
            from tenancy in activeTenancies
            join unit in _db.Units.AsNoTracking() on tenancy.UnitId equals unit.Id
            where unit.Cost.HasValue && tenancy.TotalAmountPaid!.Value < unit.Cost.Value
            select tenancy.Id)
            .CountAsync(cancellationToken);

        return Ok(new DashboardSummaryDto
        {
            OccupiedRooms = occupiedRooms,
            TotalRooms = totalRooms,
            AvailableBeds = availableBeds,
            PropertyRevenueByCurrency = revenueByCurrency,
            ActiveTenancyAgreements = activeTenancyAgreements,
            ActiveTenants = activeTenancyAgreements,
            ActiveTenanciesNotFullyPaid = activeTenanciesNotFullyPaid,
            Year = now.Year
        });
    }

    [HttpGet("occupancy-trend")]
    public async Task<IActionResult> GetOccupancyTrend(
        [FromQuery] int[]? selectedPropertyIds,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            return Unauthorized();
        }

        var isSuperManager = User.HasClaim("managerTier", "Super");
        var propertyIds = _db.Properties
            .AsNoTracking()
            .Where(property => isSuperManager || property.OwnerManagerId == managerId)
            .Select(property => property.Id);

        if (selectedPropertyIds is { Length: > 0 })
        {
            var requestedIds = selectedPropertyIds.Distinct().ToArray();
            var authorizedCount = await propertyIds
                .Where(propertyId => requestedIds.Contains(propertyId))
                .Distinct()
                .CountAsync(cancellationToken);
            if (authorizedCount != requestedIds.Length)
            {
                return Forbid();
            }

            propertyIds = propertyIds.Where(propertyId => requestedIds.Contains(propertyId));
        }

        var unitIds = _db.Units
            .AsNoTracking()
            .Where(unit => propertyIds.Contains(unit.PropertyId))
            .Select(unit => unit.Id);
        var totalBeds = await _db.Units
            .AsNoTracking()
            .Where(unit => propertyIds.Contains(unit.PropertyId))
            .SumAsync(unit => unit.MaxNoOfPeople ?? 0, cancellationToken);
        var currentYear = DateTime.UtcNow.Year;
        var trend = new List<OccupancyTrendPointDto>();

        for (var year = 2025; year <= currentYear; year++)
        {
            var asOfDate = year == currentYear
                ? DateTime.UtcNow
                : new DateTime(year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddTicks(-1);
            var bookedBeds = await _db.TenancyAgreements
                .AsNoTracking()
                .Where(tenancy => unitIds.Contains(tenancy.UnitId)
                    && tenancy.TotalAmountPaid != null
                    && tenancy.ContractStartDate <= asOfDate
                    && (tenancy.ContractEndDate == null || tenancy.ContractEndDate >= asOfDate))
                .CountAsync(cancellationToken);

            trend.Add(new OccupancyTrendPointDto
            {
                Year = year,
                AsOfDate = asOfDate,
                BookedBeds = bookedBeds,
                TotalBeds = totalBeds,
                OccupancyPercentage = totalBeds == 0 ? 0 : Math.Round(bookedBeds * 100m / totalBeds, 1)
            });
        }

        return Ok(trend);
    }
}