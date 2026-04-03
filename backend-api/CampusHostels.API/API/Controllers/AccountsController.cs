using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IWhatsAppService _whatsAppService;
    private readonly EmailService _emailService;
    private readonly IEmailSender _emailSender;
    private readonly IPasswordResetService _passwordResetService;
    IConfiguration _configuration;

    public AccountsController(IAccountService accountService, IWhatsAppService whatsAppService, EmailService emailService, IEmailSender emailSender, IPasswordResetService passwordResetService, IConfiguration config)
    {
        _accountService = accountService;
        _whatsAppService = whatsAppService;
        _emailService = emailService;
        _emailSender = emailSender;
        _passwordResetService = passwordResetService;
        _configuration = config;
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
            if (dto.PhoneNumber == response.PhoneNumber)
            {
                await _whatsAppService.SendTextMessageAsync(
                    response.PhoneNumber,
                    $"Hello {response.FirstName}, you have successfully logged in to RentIn App at {DateTime.UtcNow} UTC."
                );
            }
            if (string.Equals(dto.Email, response.Email, StringComparison.OrdinalIgnoreCase))
            {
                //     await _emailService.SendEmailAsync(
                //     response.Email,
                //     "Login Successful",
                //     $"<p>Hello {response.FirstName}, you have successfully logged in to RentIn App at {DateTime.UtcNow} UTC.</p>"
                // );
                var html = await System.IO.File.ReadAllTextAsync("Templates/LoginNotification.html");
                var resetPasswordUrl = $"{_configuration["App:BaseUrl"]}/request/password-reset";
                html = html.Replace("{{FirstName}}", response.FirstName)
                           .Replace("{{LoginTime}}", DateTime.UtcNow.ToString("f"))
                           .Replace("{{ResetPasswordUrl}}", resetPasswordUrl);
                await _emailSender.SendEmailAsync(
                    response.Email,
                    "Login Notification",
                    html,
                    display: "RentIn"
                );
            }
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto dto)
    {
        var result = await _accountService.GoogleLoginAsync(dto.AccessToken);
        return Ok(result);
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
    // POST: /api/account/request-reset
    [HttpPost("request-reset")]
    public async Task<IActionResult> RequestReset([FromBody] RequestPasswordResetDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _passwordResetService.RequestPasswordResetAsync(dto);
        // Always return 200 to avoid revealing account existence
        return Ok(new { message = "If an account with that email exists, a reset link was sent." });
    }

    // GET: /api/account/verify-reset?token=xxx&email=yyy
    [HttpPost("verify-reset")]
    public async Task<IActionResult> VerifyReset([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) ||
    (string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.PhoneNumber)))
        {
            return BadRequest(new { message = "Token and either email or phone number are required" });
        }

        var valid = await _passwordResetService.VerifyResetTokenAsync(dto);
        if (!valid) return BadRequest(new { message = "Invalid or expired token" });
        return Ok(new { message = "Token is valid" });
    }

    // POST: /api/account/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var success = await _passwordResetService.ResetPasswordAsync(dto);
        if (!success) return BadRequest(new { message = "Invalid token or unable to reset password" });
        return Ok(new { message = "Password has been reset" });
    }
    // POST: /api/account/update
    [Authorize]
    [HttpPost("update")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var success = await _accountService.UpdateUserAsync(dto);
        if (!success) return BadRequest(new { message = "User not found" });
        return Ok(new { message = "User updated successfully" });
    }
}
