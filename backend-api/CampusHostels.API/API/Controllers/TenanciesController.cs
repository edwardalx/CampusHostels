using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenanciesController : ControllerBase
{
    private readonly ITenancyService _service;

    public TenanciesController(ITenancyService service)
    {
        _service = service;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TenancyCreateDto dto)
    {
        var validator = HttpContext.RequestServices
            .GetService<FluentValidation.IValidator<TenancyCreateDto>>();

        if (validator != null)
        {
            var validation = await validator.ValidateAsync(dto);
            if (!validation.IsValid)
                return BadRequest(validation.Errors
                    .Select(e => new { e.PropertyName, e.ErrorMessage }));
        }

        var tenantIdClaim = User.FindFirst("tenantId")?.Value;
        if (tenantIdClaim is null)
            return Unauthorized();

        var tenantId = Guid.Parse(tenantIdClaim);

        var tenancy = await _service.CreateAsync(dto, tenantId);

        return CreatedAtAction(nameof(Get), new { id = tenancy.Id }, tenancy);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tenancy = await _service.GetByIdAsync(id);
        if (tenancy == null) return NotFound();
        return Ok(tenancy);
    }
}
