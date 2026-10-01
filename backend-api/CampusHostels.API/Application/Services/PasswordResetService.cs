using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusHostels.API.Application.Services
{
    // DB-backed password reset service for the project's custom User entity.
    public class PasswordResetService : IPasswordResetService
    {
        private const int MaxRequestsPerHour = 5;
        private const int MinimumPasswordLength = 8;

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

        // Email first, then phone. A blank phone number never matches (Google-created accounts have none).
        private async Task<User?> FindUserAsync(string? email, string? phoneNumber)
        {
            var normalizedEmail = email?.Trim().ToLowerInvariant() ?? string.Empty;
            var normalizedPhone = NormalizePhone(phoneNumber ?? string.Empty);

            User? user = null;
            if (normalizedEmail.Length > 0)
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
            }

            if (user is null && normalizedPhone.Length > 0)
            {
                user = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);
            }

            return user;
        }

        public async Task RequestPasswordResetAsync(RequestPasswordResetDto dto)
        {
            var user = await FindUserAsync(dto.Email, dto.PhoneNumber);

            // Always behave the same from the caller's point of view to avoid account enumeration.
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for an unknown account.");
                return;
            }

            // The link host comes ONLY from server configuration. It used to be taken from the request,
            // which let anyone make a genuine reset email point at their own site.
            var baseUrl = _config["App:BaseUrl"]?.TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                _logger.LogError("App:BaseUrl is not configured; cannot build a password reset link.");
                return;
            }

            var now = DateTime.UtcNow;

            // Stop the endpoint being used to flood someone's inbox or WhatsApp.
            var recentRequests = await _db.PasswordResetTokens
                .CountAsync(t => t.UserId == user.Id && t.CreatedAt > now.AddHours(-1));
            if (recentRequests >= MaxRequestsPerHour)
            {
                _logger.LogWarning("Password reset throttled for user {UserId}.", user.Id);
                return;
            }

            // Only the newest link should work.
            var outstanding = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.Used && t.ExpiresAt > now)
                .ToListAsync();
            foreach (var old in outstanding) old.Used = true;

            // Generate secure random token; only its hash is stored.
            var tokenBytes = new byte[32];
            RandomNumberGenerator.Fill(tokenBytes);
            var rawToken = Convert.ToBase64String(tokenBytes);

            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = ComputeSha256Hash(rawToken),
                ExpiresAt = now.Add(_tokenLifespan),
                Used = false,
                User = user
            });
            await _db.SaveChangesAsync();

            var viaEmail = !string.IsNullOrWhiteSpace(dto.Email);
            // The reset page reads these exact query keys.
            var identifierKey = viaEmail ? "Email" : "PhoneNumber";
            var identifierValue = viaEmail ? user.Email : user.PhoneNumber;
            var resetLink = $"{baseUrl}/password-reset?token={WebUtility.UrlEncode(rawToken)}&{identifierKey}={WebUtility.UrlEncode(identifierValue)}";

            // Delivery problems must not change the response (that would reveal that the account exists),
            // and the link itself is a credential, so it is never written to the logs.
            try
            {
                if (viaEmail)
                {
                    var html = "<p>You requested a password reset. Click the link below to reset your password:</p>" +
                               $"<p><a href=\"{WebUtility.HtmlEncode(resetLink)}\">Reset password</a></p>" +
                               "<p>If you didn't request this, ignore this email.</p>";

                    await _emailSender.SendEmailAsync(user.Email, "Reset your password", html);
                    _logger.LogInformation("Password reset email sent for user {UserId}.", user.Id);
                }
                else if (!string.IsNullOrWhiteSpace(user.PhoneNumber))
                {
                    var whatsAppMessage = $"You requested a password reset. Click the link below to reset your password:\n{resetLink}\n\n" +
                                          "Link expires in 1 hour. If you didn't request this, ignore this message.";

                    await _whatsAppService.SendTextMessageAsync(user.PhoneNumber, whatsAppMessage);
                    _logger.LogInformation("Password reset WhatsApp message sent for user {UserId}.", user.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deliver the password reset link for user {UserId}.", user.Id);
            }
        }

        /// <summary>
        /// Says whether the token is valid for the account. It deliberately looks at nothing else: it used to
        /// compare the proposed new password with the current one first, which let anyone test guesses against
        /// any account with a made-up token and without touching the failed-login counter.
        /// </summary>
        public async Task<bool> VerifyResetTokenAsync(ResetPasswordDto dto)
        {
            var user = await FindUserAsync(dto.Email, dto.PhoneNumber);
            if (user == null) return false;

            return await FindValidTokenAsync(user.Id, dto.Token) != null;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await FindUserAsync(dto.Email, dto.PhoneNumber);
            if (user == null) return false;

            var prt = await FindValidTokenAsync(user.Id, dto.Token);
            if (prt == null) return false;

            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < MinimumPasswordLength)
            {
                _logger.LogWarning("Attempt to reset password with an invalid new password for user {UserId}.", user.Id);
                return false;
            }

            // Only someone holding a valid reset token gets to learn this, so it is not an oracle.
            // The token is left unused so they can pick a different password.
            if (Security.PasswordHasher.Verify(dto.NewPassword, user.PasswordHash))
            {
                throw new ArgumentException("New password should not be the same as the old password.");
            }

            user.PasswordHash = AccountService.HashPassword(dto.NewPassword);
            user.LastPasswordChangeAt = DateTime.UtcNow;
            user.FailedLoginAttempts = 0; // the owner has proved control of their email/phone

            // Burn this token and any other outstanding ones.
            var now = DateTime.UtcNow;
            var outstanding = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.Used && t.ExpiresAt > now)
                .ToListAsync();
            foreach (var token in outstanding) token.Used = true;
            prt.Used = true;

            await _db.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(user.Email))
                {
                    await _emailSender.SendEmailAsync(user.Email, "Your password was changed", "<p>Your password was successfully changed.</p>");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send the password change confirmation for user {UserId}.", user.Id);
            }

            return true;
        }

        private async Task<PasswordResetToken?> FindValidTokenAsync(int userId, string? token)
        {
            if (string.IsNullOrEmpty(token)) return null;

            var hash = ComputeSha256Hash(token);
            var now = DateTime.UtcNow;
            return await _db.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.UserId == userId && !t.Used && t.ExpiresAt > now && t.TokenHash == hash);
        }

        // Reset tokens are 256 random bits, so a fast unsalted hash is fine for storing them.
        private static string ComputeSha256Hash(string raw)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToBase64String(hash);
        }
    }
}
