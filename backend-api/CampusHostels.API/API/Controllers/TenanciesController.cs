using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.API.Extensions;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenanciesController : ControllerBase
{
    private readonly ITenancyService _service;
    private readonly ApplicationDbContext _db;

    public TenanciesController(ITenancyService service, ApplicationDbContext db)
    {
        _service = service;
        _db = db;
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

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        if (!User.TryGetTenantId(out var tenantId)) return Unauthorized();

        // Someone else's tenancy looks exactly like one that does not exist.
        var owns = await _db.TenancyAgreements.AnyAsync(t => t.Id == id && t.TenantId == tenantId);
        if (!owns) return NotFound();

        var tenancy = await _service.GetByIdAsync(id);
        if (tenancy == null) return NotFound();
        return Ok(tenancy);
    }

    [Authorize]
    [HttpGet("paid/{tenantId:guid}")]
    public async Task<IActionResult> GetPaidTenancy(Guid tenantId)
    {
        if (!User.TryGetTenantId(out var callerTenantId)) return Unauthorized();
        if (callerTenantId != tenantId) return Forbid();

        var paidTenancies = await _service.GetPaidTenancyAsync(tenantId);

        return Ok(paidTenancies); // returns [] if none
    }


}
