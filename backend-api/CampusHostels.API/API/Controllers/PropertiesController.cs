using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyRepository _repo;
    private readonly IMapper _mapper;
    private readonly IManagerService _managerService;

    public PropertiesController(IPropertyRepository repo, IMapper mapper, IManagerService managerService)
    {
        _repo = repo;
        _mapper = mapper;
        _managerService = managerService;
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
