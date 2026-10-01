using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

/// <summary>
/// Recent bookings and activity for the Reports page. Super managers see everything and may
/// filter by property owner; other managers see only properties they own.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireManager")]
public class ReportsController : ControllerBase
{
    private const int DefaultBookingsPageSize = 5;
    private const int DefaultActivityPageSize = 5;
    // Each page merges two sources, so deep pages cost more; cap how far back a client can page.
    private const int MaxActivityWindow = 1000;

    private readonly ApplicationDbContext _db;

    public ReportsController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>Bookings (tenancy agreements), newest booking first.</summary>
    [HttpGet("recent-bookings")]
    public async Task<IActionResult> GetRecentBookings(
        [FromQuery] Guid? ownerId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultBookingsPageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize < 1 || pageSize > Paging.MaxPageSize)
        {
            return BadRequest(new { error = $"page must be at least 1 and pageSize between 1 and {Paging.MaxPageSize}." });
        }

        if (!TryGetScope(ownerId, out var scopeOwnerId, out var denied))
        {
            return denied!;
        }

        var bookings = ScopedBookings(scopeOwnerId, ownerId);
        var totalCount = await bookings.CountAsync(cancellationToken);

        var rows = await bookings
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.User!.FirstName,
                t.User.LastName,
                PropertyName = t.Property!.Name,
                t.Unit!.RoomNumber,
                t.ContractStartDate,
                t.ContractEndDate,
                t.IsActive,
                HasPaid = t.TotalAmountPaid != null
            })
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var items = rows.Select(row => new RecentBookingDto
        {
            TenancyId = row.Id,
            TenantName = $"{row.FirstName} {row.LastName}".Trim(),
            PropertyName = row.PropertyName,
            RoomNumber = row.RoomNumber,
            ContractStartDate = row.ContractStartDate,
            ContractEndDate = row.ContractEndDate,
            Status = BookingStatusFor(row.IsActive, row.HasPaid, row.ContractStartDate, row.ContractEndDate, now)
        }).ToList();

        return Ok(new RecentBookingsResponseDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    /// <summary>
    /// Latest bookings, payments and maintenance requests together, newest first, paged.
    /// </summary>
    [HttpGet("recent-activity")]
    public async Task<IActionResult> GetRecentActivity(
        [FromQuery] Guid? ownerId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultActivityPageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize < 1 || pageSize > Paging.MaxPageSize)
        {
            return BadRequest(new { error = $"page must be at least 1 and pageSize between 1 and {Paging.MaxPageSize}." });
        }

        // The sources are merged in memory, so page N needs the newest N * pageSize of each.
        var window = page * pageSize;
        if (window > MaxActivityWindow)
        {
            return BadRequest(new { error = $"Only the most recent {MaxActivityWindow} updates can be paged through." });
        }

        if (!TryGetScope(ownerId, out var scopeOwnerId, out var denied))
        {
            return denied!;
        }

        var bookings = ScopedBookings(scopeOwnerId, ownerId);
        var payments = ScopedPayments(scopeOwnerId, ownerId);
        var maintenance = ScopedMaintenance(scopeOwnerId, ownerId);

        var totalCount = await bookings.CountAsync(cancellationToken)
            + await payments.CountAsync(cancellationToken)
            + await maintenance.CountAsync(cancellationToken);

        var bookingRows = await bookings
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Take(window)
            .Select(t => new
            {
                t.User!.FirstName,
                t.User.LastName,
                PropertyName = t.Property!.Name,
                t.Unit!.RoomNumber,
                t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var paymentRows = await payments
            .OrderByDescending(p => p.OccurredAt)
            .ThenByDescending(p => p.Id)
            .Take(window)
            .ToListAsync(cancellationToken);

        var maintenanceRows = await maintenance
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Take(window)
            .Select(r => new
            {
                r.Category,
                r.Title,
                PropertyName = r.Property!.Name,
                r.Unit!.RoomNumber,
                r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var items = bookingRows
            .Select(row => new ActivityItemDto
            {
                Type = "Booking",
                Title = "New booking",
                Detail = $"{row.FirstName} {row.LastName} booked room {row.RoomNumber ?? "-"} at {row.PropertyName}",
                OccurredAt = row.CreatedAt
            })
            .Concat(paymentRows.Select(row => new ActivityItemDto
            {
                Type = "Payment",
                Title = row.Status switch
                {
                    PaymentStatus.Success => "Payment received",
                    PaymentStatus.Failed => "Payment failed",
                    _ => "Payment pending"
                },
                Detail = $"{row.Currency} {row.Amount:N2} from {(string.IsNullOrWhiteSpace(row.FirstName + row.LastName) ? "unknown tenant" : $"{row.FirstName} {row.LastName}".Trim())} · {row.PropertyName}",
                OccurredAt = row.OccurredAt
            }))
            .Concat(maintenanceRows.Select(row => new ActivityItemDto
            {
                Type = "Maintenance",
                Title = "Maintenance request",
                Detail = $"{row.Category}: {row.Title} · room {row.RoomNumber ?? "-"} at {row.PropertyName}",
                OccurredAt = row.CreatedAt
            }))
            .OrderByDescending(item => item.OccurredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new ActivityPageDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    /// <summary>
    /// Counts for the in-app alert badges: activity (bookings, payments, maintenance requests)
    /// that happened after <paramref name="since"/>, and maintenance requests still open.
    /// </summary>
    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts(
        [FromQuery] DateTime? since = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetScope(null, out var scopeOwnerId, out var denied))
        {
            return denied!;
        }

        var openMaintenance = await ScopedMaintenance(scopeOwnerId, null)
            .CountAsync(r => r.Status == MaintenanceStatus.Open, cancellationToken);

        var newActivity = 0;
        if (since.HasValue)
        {
            var cutoff = since.Value.ToUniversalTime();
            newActivity =
                await ScopedBookings(scopeOwnerId, null).CountAsync(t => t.CreatedAt > cutoff, cancellationToken)
                + await ScopedPayments(scopeOwnerId, null).CountAsync(p => p.OccurredAt > cutoff, cancellationToken)
                + await ScopedMaintenance(scopeOwnerId, null).CountAsync(r => r.CreatedAt > cutoff, cancellationToken);
        }

        return Ok(new AlertCountsDto { NewActivity = newActivity, OpenMaintenance = openMaintenance });
    }

    /// <summary>
    /// Works out which owner the data is restricted to. Super managers are unrestricted
    /// (scopeOwnerId null) and may pass ownerId; everyone else is limited to their own properties.
    /// </summary>
    private bool TryGetScope(Guid? requestedOwnerId, out Guid? scopeOwnerId, out IActionResult? denied)
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

    private IQueryable<Domain.Entities.TenancyAgreement> ScopedBookings(Guid? scopeOwnerId, Guid? ownerId) =>
        _db.TenancyAgreements
            .AsNoTracking()
            .Where(t => t.User != null && t.Property != null && t.Unit != null)
            .Where(t => scopeOwnerId == null || t.Property!.OwnerManagerId == scopeOwnerId)
            .Where(t => ownerId == null || t.Property!.OwnerManagerId == ownerId);

    private IQueryable<Domain.Entities.MaintenanceRequest> ScopedMaintenance(Guid? scopeOwnerId, Guid? ownerId) =>
        _db.MaintenanceRequests
            .AsNoTracking()
            .Where(r => scopeOwnerId == null || r.Property!.OwnerManagerId == scopeOwnerId)
            .Where(r => ownerId == null || r.Property!.OwnerManagerId == ownerId);

    private IQueryable<PaymentActivityRow> ScopedPayments(Guid? scopeOwnerId, Guid? ownerId) =>
        from payment in _db.Payments.AsNoTracking()
        join unit in _db.Units.AsNoTracking() on payment.UnitId equals unit.Id
        join property in _db.Properties.AsNoTracking() on unit.PropertyId equals property.Id
        join user in _db.Users.AsNoTracking() on payment.TenantId equals user.TenantId into users
        from user in users.DefaultIfEmpty()
        where (scopeOwnerId == null || property.OwnerManagerId == scopeOwnerId)
            && (ownerId == null || property.OwnerManagerId == ownerId)
        select new PaymentActivityRow
        {
            Id = payment.Id,
            Amount = payment.Amount,
            Currency = payment.Currency,
            Status = payment.Status,
            FirstName = user != null ? user.FirstName : "",
            LastName = user != null ? user.LastName : "",
            PropertyName = property.Name,
            OccurredAt = payment.PaidAt ?? payment.CreatedAt
        };

    private sealed class PaymentActivityRow
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PropertyName { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; }
    }

    private static string BookingStatusFor(bool isActive, bool hasPaid, DateTime start, DateTime? end, DateTime now)
    {
        if (!isActive || !hasPaid) return BookingStatus.Pending;
        if (end != null && end.Value.Date < now.Date) return BookingStatus.Ended;
        return start <= now ? BookingStatus.CheckedIn : BookingStatus.Confirmed;
    }
}
