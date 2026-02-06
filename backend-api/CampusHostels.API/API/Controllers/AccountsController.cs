using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var response = await _accountService.RegisterAsync(dto);
            return CreatedAtAction(null, new { id = response.Email }, response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var response = await _accountService.LoginAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("check-email-phone")]
    public async Task<IActionResult> CheckEmailPhone([FromBody] LoginDto dto)
    {
        var result = await _accountService.EmailPhoneNoCheckAsync(dto);
        return Ok(result);
    }

    [HttpGet("check-email-phone")]
    public async Task<IActionResult> CheckEmailPhone([FromQuery] string email, [FromQuery] string phoneNumber)
    {
        var dto = new LoginDto { Email = email, PhoneNumber = phoneNumber };
        var result = await _accountService.EmailPhoneNoCheckAsync(dto);
        return Ok(result);
    }
}
