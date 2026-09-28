using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ManagersController : ControllerBase
{
    private readonly IManagerService _managerService;

    public ManagersController(IManagerService managerService)
    {
        _managerService = managerService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] ManagerLoginDto dto)
    {
        try
        {
            var response = await _managerService.LoginAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [Authorize(Policy = "RequireManager")]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var managerIdClaim = User.FindFirst("managerId")?.Value;
        if (!Guid.TryParse(managerIdClaim, out var managerId)) return Unauthorized();

        var profile = await _managerService.GetCurrentManagerAsync(managerId);
        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [Authorize(Policy = "RequireManager")]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ManagerChangePasswordDto dto)
    {
        var managerIdClaim = User.FindFirst("managerId")?.Value;
        if (!Guid.TryParse(managerIdClaim, out var managerId)) return Unauthorized();

        try
        {
            await _managerService.ChangePasswordAsync(managerId, dto);
            return Ok(new { message = "Password updated successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [Authorize(Policy = "RequireManager")]
    [HttpGet("{managerId:guid}/functions")]
    public async Task<IActionResult> GetFunctions(Guid managerId)
    {
        try
        {
            return Ok(await _managerService.GetFunctionsAsync(managerId));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [Authorize(Policy = "RequireSuperManager")]
    [HttpPut("{managerId:guid}/functions")]
    public async Task<IActionResult> SetFunctions(Guid managerId, [FromBody] ManagerFunctionsUpdateDto dto)
    {
        try
        {
            var profile = await _managerService.SetFunctionsAsync(managerId, dto.Functions);
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Deliberately not a public "register" endpoint — Manager accounts are never self-service.
    // Only an existing Super Manager can create new manager accounts.
    [Authorize(Policy = "RequireSuperManager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ManagerCreateDto dto)
    {
        try
        {
            var profile = await _managerService.CreateManagerAsync(dto);
            return CreatedAtAction(nameof(Me), profile);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [Authorize(Policy = "RequireSuperManager")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var managers = await _managerService.GetAllManagersAsync();
        return Ok(managers);
    }

    [Authorize(Policy = "RequireSuperManager")]
    [HttpPut("{managerId:guid}")]
    public async Task<IActionResult> Update(Guid managerId, [FromBody] ManagerUpdateDto dto)
    {
        try
        {
            var profile = await _managerService.UpdateManagerAsync(managerId, dto);
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
