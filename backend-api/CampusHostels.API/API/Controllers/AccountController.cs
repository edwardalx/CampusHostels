using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.DTOs.Account;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IPasswordResetService _passwordResetService;
        private readonly IWhatsAppService _whatsAppService;
        private readonly IAccountService _accountService;

        public AccountController(IPasswordResetService passwordResetService, IWhatsAppService whatsAppService, IAccountService accountService)
        {
            _passwordResetService = passwordResetService;
            _whatsAppService = whatsAppService;
            _accountService = accountService;
        }

        // POST: /api/account/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var result = await _accountService.RegisterAsync(dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
        [HttpGet("verify-reset")]
        public async Task<IActionResult> VerifyReset([FromQuery] string token, [FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Token and email are required" });

            var valid = await _passwordResetService.VerifyResetTokenAsync(email, token);
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

        // POST: /api/account/send-whatsapp
        [HttpPost("send-whatsapp")]
        public async Task<IActionResult> SendWhatsApp([FromBody] SendWhatsAppDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sidOrNull = await _whatsAppService.SendMessageAsync(dto.PhoneNumber, dto.Message);
            if (sidOrNull == null) return BadRequest(new { message = "Failed to send WhatsApp message" });
            return Ok(new WhatsAppResponseDto { MessageSid = sidOrNull, Success = true, Message = "WhatsApp message sent successfully" });
        }

        // POST: /api/account/send-whatsapp-template
        [HttpPost("send-whatsapp-template")]
        public async Task<IActionResult> SendWhatsAppTemplate([FromBody] SendWhatsAppTemplateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sidOrNull = await _whatsAppService.SendTemplateMessageAsync(dto.PhoneNumber, dto.TemplateName, dto.Parameters);
            if (sidOrNull == null) return BadRequest(new { message = "Failed to send WhatsApp template message" });
            return Ok(new WhatsAppResponseDto { MessageSid = sidOrNull, Success = true, Message = "WhatsApp template message sent successfully" });
        }

        // POST: /api/account/update
        [HttpPost("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _accountService.UpdateUserAsync(dto);
            if (!success) return BadRequest(new { message = "User not found" });
            return Ok(new { message = "User updated successfully" });
        }
    }
}
