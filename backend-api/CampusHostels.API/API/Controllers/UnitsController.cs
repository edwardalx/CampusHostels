using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/properties/{propertyId:int}/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly IUnitRepository _repo;
    private readonly IMapper _mapper;

    public UnitsController(IUnitRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<IActionResult> GetByProperty(int propertyId)
    {
        var items = await _repo.GetByPropertyIdAsync(propertyId);
        return Ok(items.Select(u => _mapper.Map<UnitDto>(u)));
    }

    [HttpGet("../units/{id:int}")]
    public async Task<IActionResult> Get(int propertyId, int id)
    {
        var item = await _repo.GetByIdAsync(id);
        if (item == null || item.PropertyId != propertyId) return NotFound();
        return Ok(_mapper.Map<UnitDto>(item));
    }

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
