using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenanciesController : ControllerBase
{
    private readonly ITenancyRepository _repo;
    private readonly IMapper _mapper;

    public TenanciesController(ITenancyRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TenancyCreateDto dto)
    {
        var validator = HttpContext.RequestServices.GetService<FluentValidation.IValidator<TenancyCreateDto>>();
        if (validator != null)
        {
            var validation = await validator.ValidateAsync(dto);
            if (!validation.IsValid) return BadRequest(validation.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
        }

        var tenancy = _mapper.Map<TenancyAgreement>(dto);
        tenancy.ComputeContractEndDate();
        await _repo.AddAsync(tenancy);
        await _repo.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = tenancy.Id }, tenancy);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tenancy = await _repo.GetByIdAsync(id);
        if (tenancy == null) return NotFound();
        return Ok(tenancy);
    }
}
