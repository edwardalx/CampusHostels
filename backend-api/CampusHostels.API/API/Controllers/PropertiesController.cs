using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyRepository _repo;
    private readonly IMapper _mapper;
    private readonly IManagerService _managerService;
    private readonly ApplicationDbContext _db;

    public PropertiesController(
        IPropertyRepository repo,
        IMapper mapper,
        IManagerService managerService,
        ApplicationDbContext db)
    {
        _repo = repo;
        _mapper = mapper;
        _managerService = managerService;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _repo.GetAllAsync();
        var dtos = items.Select(p => _mapper.Map<PropertyDto>(p));
        return Ok(dtos);
    }

    [Authorize(Policy = "RequireManager")]
    [HttpGet("managed")]
    public async Task<IActionResult> GetManaged([FromQuery] Guid? ownerId = null, [FromQuery] string? sortOccupancy = null)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId))
        {
            return Unauthorized();
        }

        if (!await _managerService.CanManagePropertiesAsync(managerId))
        {
            return Forbid();
        }

        var isSuperManager = User.HasClaim("managerTier", "Super");
        if (sortOccupancy is not null
            && !sortOccupancy.Equals("asc", StringComparison.OrdinalIgnoreCase)
            && !sortOccupancy.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "sortOccupancy must be 'asc' or 'desc'." });
        }

        var properties = (await _repo.GetForManagerAsync(isSuperManager ? null : managerId)).ToList();

        // Owner filtering is a super-manager feature; other managers only ever see their own properties.
        if (ownerId.HasValue)
        {
            if (!isSuperManager) return Forbid();
            properties = properties.Where(property => property.OwnerManagerId == ownerId.Value).ToList();
        }

        var propertyIds = properties.Select(property => property.Id).ToArray();
        var now = DateTime.UtcNow;
        var today = now.Date;
        var occupiedRoomsByProperty = await (
            from tenancy in _db.TenancyAgreements.AsNoTracking()
            join unit in _db.Units.AsNoTracking() on tenancy.UnitId equals unit.Id
            where propertyIds.Contains(unit.PropertyId)
                && tenancy.IsActive
                && tenancy.TotalAmountPaid != null
                && tenancy.ContractStartDate <= now
                && (tenancy.ContractEndDate == null || tenancy.ContractEndDate >= today)
            select new { unit.PropertyId, tenancy.UnitId })
            .Distinct()
            .GroupBy(item => item.PropertyId)
            .Select(group => new { PropertyId = group.Key, OccupiedRooms = group.Count() })
            .ToDictionaryAsync(item => item.PropertyId, item => item.OccupiedRooms);

        var revenueRows = await (
            from payment in _db.Payments.AsNoTracking()
            join unit in _db.Units.AsNoTracking() on payment.UnitId equals unit.Id
            where propertyIds.Contains(unit.PropertyId)
                && payment.Status == PaymentStatus.Success
                && payment.PaidAt >= new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                && payment.PaidAt < new DateTime(now.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            group payment by new { unit.PropertyId, payment.Currency }
            into payments
            select new
            {
                payments.Key.PropertyId,
                payments.Key.Currency,
                Amount = payments.Sum(payment => payment.Amount)
            })
            .ToListAsync();
        var revenueByProperty = revenueRows
            .GroupBy(row => row.PropertyId)
            .ToDictionary(
                group => group.Key,
                group => group.ToDictionary(row => row.Currency, row => row.Amount));

        var dtos = properties.Select(property =>
        {
            var totalRooms = property.Units.Count;
            var occupiedRooms = occupiedRoomsByProperty.GetValueOrDefault(property.Id);
            return new ManagedPropertyDto
            {
                Id = property.Id,
                Name = property.Name,
                Location = property.Location,
                ImageUrl = property.ImageUrl,
                OwnerManagerId = property.OwnerManagerId,
                NoOfUnits = totalRooms,
                NoOfFloors = property.NoOfFloors,
                AverageRating = property.AverageRating,
                Availability = property.Availability,
                StartingPrice = property.Units
                .Where(unit => unit.Cost.HasValue)
                .Select(unit => unit.Cost)
                .Min() ?? property.StartingPrice,
                OccupiedRooms = occupiedRooms,
                OccupancyPercentage = totalRooms == 0 ? 0 : Math.Round(occupiedRooms * 100m / totalRooms, 1),
                RevenueByCurrency = revenueByProperty.GetValueOrDefault(property.Id) ?? []
            };
        });

        if (sortOccupancy is not null)
        {
            dtos = sortOccupancy.Equals("asc", StringComparison.OrdinalIgnoreCase)
                ? dtos.OrderBy(dto => dto.OccupancyPercentage).ThenBy(dto => dto.Name)
                : dtos.OrderByDescending(dto => dto.OccupancyPercentage).ThenBy(dto => dto.Name);
        }

        return Ok(dtos.ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _repo.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(_mapper.Map<PropertyDto>(item));
    }

    [Authorize(Policy = "RequireManager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PropertyCreateDto dto)
    {
        var currentManagerId = User.FindFirst("managerId")?.Value;
        if (!Guid.TryParse(currentManagerId, out var creatorManagerId) || dto.OwnerManagerId is not Guid ownerManagerId)
        {
            return BadRequest(new { error = "A valid property owner is required." });
        }

        var canAssignAnotherOwner = await _managerService.CanManagePropertiesAsync(creatorManagerId);
        if (!canAssignAnotherOwner && ownerManagerId != creatorManagerId)
        {
            return Forbid();
        }

        if (!await _managerService.IsActiveManagerAsync(ownerManagerId))
        {
            return BadRequest(new { error = "The selected property owner is not an active manager." });
        }

        var entity = _mapper.Map<Domain.Entities.Property>(dto);
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        var read = _mapper.Map<PropertyDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = read.Id }, read);
    }
}
