using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/properties/{propertyId:int}/[controller]")]  // Controller route has propertyId
public class UnitsController : ControllerBase
{
    private readonly IUnitRepository _repo;
    private readonly IPropertyRepository _propertyRepo;
    private readonly IMapper _mapper;

    public UnitsController(IUnitRepository repo, IPropertyRepository propertyRepo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
        _propertyRepo = propertyRepo;
    }

    // GET api/properties/{propertyId}/units
    [HttpGet]
    public async Task<IActionResult> GetByProperty(int propertyId)
    {
        var items = await _repo.GetByPropertyIdAsync(propertyId);
        return Ok(items.Select(u => _mapper.Map<UnitDto>(u)));
    }

    // GET api/properties/{propertyId}/units/{unitId}
    [HttpGet("{unitId:int}")]  // Removed redundant propertyId here
    public async Task<IActionResult> Get(int propertyId, int unitId)
    {
        var item = await _repo.GetByIdAsync(unitId);
        var property = await _propertyRepo.GetByIdAsync(item!.PropertyId);
        if (item == null || item.PropertyId != propertyId) return NotFound();
        var unitDto = _mapper.Map<UnitDto>(item);
        unitDto.PropertyName = property?.Name; // Set property name in DTO
        return Ok(unitDto);
    }

    // POST api/properties/{propertyId}/units
    [HttpPost]
    public async Task<IActionResult> Create(int propertyId, [FromBody] UnitCreateDto dto)
    {
        // Validate DTO
        var validator = HttpContext.RequestServices.GetService<FluentValidation.IValidator<UnitCreateDto>>();
        if (validator != null)
        {
            var result = await validator.ValidateAsync(dto);
            if (!result.IsValid)
            {
                return BadRequest(result.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
            }
        }

        var unit = _mapper.Map<Domain.Entities.Unit>(dto);
        unit.PropertyId = propertyId;
        await _repo.AddAsync(unit);
        await _repo.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { propertyId = propertyId, id = unit.Id }, _mapper.Map<UnitDto>(unit));
    }
}
