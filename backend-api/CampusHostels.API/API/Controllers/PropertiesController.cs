using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyRepository _repo;
    private readonly IMapper _mapper;

    public PropertiesController(IPropertyRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _repo.GetAllAsync();
        var dtos = items.Select(p => _mapper.Map<PropertyDto>(p));
        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _repo.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(_mapper.Map<PropertyDto>(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PropertyCreateDto dto)
    {
        var entity = _mapper.Map<Domain.Entities.Property>(dto);
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        var read = _mapper.Map<PropertyDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = read.Id }, read);
    }
}
