using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/Payments")]
public class ManagedPaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ManagedPaymentsController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Lists payments for the signed-in manager. Super managers see every payment and may filter
    /// by property owner; other managers see only payments for properties they own.
    /// </summary>
    /// <param name="ownerId">Super managers only: restrict to properties owned by this manager.</param>
    /// <param name="search">Case-insensitive match on tenant name or email. Narrows the list only, not the summary.</param>
    /// <param name="sortBy">"date" (default), "amount" or "name" (tenant name).</param>
    /// <param name="page">1-based page number (default 1).</param>
    /// <param name="pageSize">Rows per page (default 25, max 100).</param>
    /// <param name="sortDir">"asc" or "desc" (default for date and amount is desc; name is asc).</param>
    [Authorize(Policy = "RequireManager")]
    [HttpGet("managed")]
    public async Task<IActionResult> GetManaged(
        [FromQuery] Guid? ownerId = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = Paging.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            return Unauthorized();
        }

        if (page < 1 || pageSize < 1 || pageSize > Paging.MaxPageSize)
        {
            return BadRequest(new { error = $"page must be at least 1 and pageSize between 1 and {Paging.MaxPageSize}." });
        }

        var sortKey = (sortBy ?? "date").ToLowerInvariant();
        if (sortKey is not ("date" or "amount" or "name"))
        {
            return BadRequest(new { error = "sortBy must be 'date', 'amount' or 'name'." });
        }

        if (sortDir is not null && !sortDir.Equals("asc", StringComparison.OrdinalIgnoreCase)
            && !sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "sortDir must be 'asc' or 'desc'." });
        }

        var descending = sortDir is null
            ? sortKey != "name"
            : sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase);

        var isSuperManager = User.HasClaim("managerTier", "Super");
        if (ownerId.HasValue && !isSuperManager)
        {
            return Forbid();
        }

        var scoped =
            from payment in _db.Payments.AsNoTracking()
            join unit in _db.Units.AsNoTracking() on payment.UnitId equals unit.Id
            join property in _db.Properties.AsNoTracking() on unit.PropertyId equals property.Id
            where (isSuperManager || property.OwnerManagerId == managerId)
                && (ownerId == null || property.OwnerManagerId == ownerId)
            select new { payment, unit, property };

        var rows =
            from item in scoped
            join user in _db.Users.AsNoTracking() on item.payment.TenantId equals user.TenantId into users
            from user in users.DefaultIfEmpty()
            select new
            {
                item.payment,
                item.unit,
                item.property,
                FirstName = user != null ? user.FirstName : "",
                LastName = user != null ? user.LastName : "",
                Date = item.payment.PaidAt ?? item.payment.CreatedAt
            };

        var term = search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(term))
        {
            rows = rows.Where(r =>
                (r.FirstName + " " + r.LastName).ToLower().Contains(term)
                || r.payment.Email.ToLower().Contains(term));
        }

        var ordered = (sortKey, descending) switch
        {
            ("amount", false) => rows.OrderBy(r => r.payment.Amount).ThenBy(r => r.payment.Id),
            ("amount", true) => rows.OrderByDescending(r => r.payment.Amount).ThenBy(r => r.payment.Id),
            ("name", false) => rows.OrderBy(r => r.FirstName).ThenBy(r => r.LastName).ThenBy(r => r.payment.Id),
            ("name", true) => rows.OrderByDescending(r => r.FirstName).ThenByDescending(r => r.LastName).ThenBy(r => r.payment.Id),
            (_, false) => rows.OrderBy(r => r.Date).ThenBy(r => r.payment.Id),
            _ => rows.OrderByDescending(r => r.Date).ThenBy(r => r.payment.Id),
        };

        var totalCount = await rows.CountAsync(cancellationToken);

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ManagedPaymentDto
            {
                PaymentId = r.payment.Id,
                Reference = r.payment.Reference,
                TenantId = r.payment.TenantId,
                TenantName = (r.FirstName + " " + r.LastName).Trim(),
                Email = r.payment.Email,
                PropertyId = r.property.Id,
                PropertyName = r.property.Name,
                OwnerManagerId = r.property.OwnerManagerId,
                UnitId = r.unit.Id,
                RoomNumber = r.unit.RoomNumber,
                Amount = r.payment.Amount,
                Currency = r.payment.Currency,
                Status = r.payment.Status.ToString(),
                Channel = r.payment.Channel,
                Date = r.Date
            })
            .ToListAsync(cancellationToken);

        // Summaries cover the same scope (including the owner filter) as the list.
        var now = DateTime.UtcNow;
        var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextYearStart = yearStart.AddYears(1);

        var collected = await scoped
            .Where(r => r.payment.Status == PaymentStatus.Success
                && r.payment.PaidAt >= yearStart
                && r.payment.PaidAt < nextYearStart)
            .GroupBy(r => r.payment.Currency)
            .Select(g => new { Currency = g.Key, Amount = g.Sum(r => r.payment.Amount) })
            .ToDictionaryAsync(r => r.Currency, r => r.Amount, cancellationToken);

        var pending = await scoped.CountAsync(r => r.payment.Status == PaymentStatus.Pending, cancellationToken);
        var failed = await scoped.CountAsync(r => r.payment.Status == PaymentStatus.Failed, cancellationToken);

        return Ok(new ManagedPaymentsResponseDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Summary = new PaymentSummaryDto
            {
                CollectedThisYearByCurrency = collected,
                Pending = pending,
                Failed = failed,
                Year = now.Year
            }
        });
    }
}
