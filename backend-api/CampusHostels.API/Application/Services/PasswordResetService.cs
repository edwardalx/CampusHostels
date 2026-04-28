using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Application.Services;
using Microsoft.Extensions.Logging;
using Sprache;

namespace CampusHostels.API.Application.Services
{
    // DB-backed password reset service for the project's custom User entity.
    public class PasswordResetService : IPasswordResetService
    {
        private readonly ApplicationDbContext _db;
        private readonly IEmailSender _emailSender;
        private readonly IWhatsAppService _whatsAppService;
        private readonly ILogger<PasswordResetService> _logger;
        private readonly TimeSpan _tokenLifespan = TimeSpan.FromHours(1);
        private readonly IConfiguration _config;


        public PasswordResetService(
            ApplicationDbContext db,
            IEmailSender emailSender,
            IWhatsAppService whatsAppService,
            ILogger<PasswordResetService> logger,
            IConfiguration config
            )
        {
            _db = db;
            _emailSender = emailSender;
            _whatsAppService = whatsAppService;
            _logger = logger;
            _config = config;
        }
        private static string NormalizePhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
            // Keep only digits; preserve a single leading '+' if present anywhere in the input.
            var hasPlus = phone.Contains('+');
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (string.IsNullOrEmpty(digits)) return string.Empty;
            return hasPlus ? "+" + digits : digits;
        }


        public async Task RequestPasswordResetAsync(RequestPasswordResetDto dto)
        {
            var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);
            var user = _db.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail) ?? _db.Users.FirstOrDefault(u => u.PhoneNumber == normalizedPhone);

            // Always return success to avoid account enumeration
            if (user == null)
            {
                _logger.LogInformation($"Password reset requested for non-existing email: {dto.Email}");
                return;
            }

            // Generate secure random token
            var tokenBytes = new byte[32];
            RandomNumberGenerator.Fill(tokenBytes);
            var rawToken = Convert.ToBase64String(tokenBytes); // raw token

            // Store hash of the raw token
            var tokenHash = ComputeSha256Hash(rawToken);

            var prt = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.Add(_tokenLifespan),
                Used = false,
                User = user
            };

            _db.PasswordResetTokens.Add(prt);
            await _db.SaveChangesAsync();
            var baseUrl = string.IsNullOrWhiteSpace(dto.ResetUrlBase) ? _config["App:BaseUrl"] : dto.ResetUrlBase.TrimEnd('/');
            var identifier = !string.IsNullOrWhiteSpace(dto.Email) ? "Email" : "phonenumber";
            var identifierValue = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email : dto.PhoneNumber;
            var resetLink = $"{baseUrl}/password-reset?token={WebUtility.UrlEncode(rawToken)}&{identifier}={WebUtility.UrlEncode(identifierValue)}";

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                _logger.LogInformation($"[DEV] Password reset link for {user.Email}: {resetLink}");

                var html = $"<p>You requested a password reset. Click the link below to reset your password:</p>" +
                           $"<p><a href=\"{resetLink}\">Reset password</a></p>" +
                           $"<p>If you didn't request this, ignore this email.</p>";

                try
                {
                    await _emailSender.SendEmailAsync(user.Email, "Reset your password", html);
                    _logger.LogInformation($"Password reset email sent to {user.Email}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to send password reset email to {user.Email}; continuing with WhatsApp");
                }
            }
            else
            {
                // WhatsApp message
                var whatsAppMessage = $"You requested a password reset. Click the link below to reset your password:\n{resetLink}\n\n" +
                                      "Link expires in 1 hour. If you didn't request this, ignore this message.";

                await _whatsAppService.SendTextMessageAsync(user.PhoneNumber, whatsAppMessage);
                _logger.LogInformation($"Password reset WhatsApp message sent to {user.PhoneNumber}");
            }
        }

        public Task<bool> VerifyResetTokenAsync(ResetPasswordDto dto)
        {
            var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);
            var user = _db.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail) ?? _db.Users.FirstOrDefault(u => u.PhoneNumber == normalizedPhone);
            if (user == null) return Task.FromResult(false);
            var result = AccountService.VerifyPassword(dto.NewPassword!, user.PasswordHash);
            if (result)
            {
                _logger.LogWarning("Password verification failed for {Email} as the new password is the same as the old password", dto.Email);
                throw new ArgumentException("New password should not be the same as the old password.");
            }

            // Accept token whether it's URL-encoded or not by decoding first
            // var decoded = WebUtility.UrlDecode(dto.Token ?? string.Empty) ?? string.Empty;
            var token = dto.Token ?? string.Empty;
            var hash = ComputeSha256Hash(token);

            var match = _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.Used && t.ExpiresAt > DateTime.UtcNow)
                .Any(t => t.TokenHash == hash);

            return Task.FromResult(match);
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var user = _db.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
            if (user == null) return false;

            // var decoded = WebUtility.UrlDecode(dto.Token ?? string.Empty) ?? string.Empty;
            var token = dto.Token ?? string.Empty;

            var prt = _db.PasswordResetTokens.FirstOrDefault(t => t.UserId == user.Id && !t.Used && t.ExpiresAt > DateTime.UtcNow && t.TokenHash == ComputeSha256Hash(token));
            if (prt == null) return false;

            // Update password using same hashing mechanism as AccountService (SHA256)
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            {
                _logger.LogWarning("Attempt to reset password with invalid new password for {Email}", dto.Email);
                return false;
            }
            user.PasswordHash = AccountService.HashPassword(dto.NewPassword);
            prt.Used = true;
            user.LastPasswordChangeAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(dto.Email))
                {
                    await _emailSender.SendEmailAsync(dto.Email, "Your password was changed", "<p>Your password was successfully changed.</p>");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Failed to send password reset confirmation email to {dto.Email}");
            }
            return true;
        }

        private static string ComputeSha256Hash(string raw)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(raw);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        
    }
}