using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class AccountService : IAccountService
{
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;

    public AccountService(ApplicationDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Normalize inputs
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);

        // Single DB call to check for existing user by email or phone
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail || u.PhoneNumber == normalizedPhone);
        if (existing != null)
        {
            if (existing.Email == normalizedEmail) throw new InvalidOperationException("Email already exists.");
            if (existing.PhoneNumber == normalizedPhone) throw new InvalidOperationException("Phone Number already exists.");
        }

        // Create new user
        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            TenantId = Guid.NewGuid(),
            Email = normalizedEmail,
            PhoneNumber = normalizedPhone,
            Role = dto.Role,
            // respect DTO value (defaults to false) so clients can opt-in on registration
            IsActive = dto.IsActive,
            PasswordHash = HashPassword(dto.Password)
        };

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message ?? ex.Message;

            // Detect common unique constraint messages/index names and map to friendly errors
            if (inner.Contains("IX_Users_PhoneNumber") || inner.Contains("PhoneNumber") || inner.Contains("UNIQUE constraint failed") || inner.Contains("duplicate"))
            {
                throw new InvalidOperationException("Phone Number already exists.");
            }

            if (inner.Contains("IX_Users_Email") || inner.Contains("Email"))
            {
                throw new InvalidOperationException("Email already exists.");
            }

            throw;
        }

        // Generate token
        var token = _tokenService.CreateToken(user, out var expires);

        return new AuthResponseDto
        {
            Token = token,
            FirstName = user.FirstName,
            PhoneNumber = user.PhoneNumber,
            TenantId = user.TenantId,
            Email = user.Email,
            Role = user.Role,
            Expires = expires
        };
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

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        // Normalize inputs for lookup
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);

        if (string.IsNullOrWhiteSpace(normalizedEmail) && string.IsNullOrWhiteSpace(normalizedPhone))
        {
            throw new UnauthorizedAccessException("Email or phone number is required.");
        }

        // Single DB call to find matching user
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail || u.PhoneNumber == normalizedPhone);

        if (user is null)
        {
            throw new UnauthorizedAccessException("No account matches the provided email or phone number.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("User account is inactive. Contact support to activate your account.");
        }

        if (!VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid password.");
        }

        // Generate token
        var token = _tokenService.CreateToken(user, out var expires);

        return new AuthResponseDto
        {
            Token = token,
            TenantId = user.TenantId,
            FirstName = user.FirstName,
            PhoneNumber = user.PhoneNumber,
            Email = user.Email,
            Role = user.Role,
            Expires = expires
        };
    }

    /// <summary>Hash a password using SHA256 (dev-only; replace with Identity later).</summary>
    private string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    /// <summary>Verify a password against its hash.</summary>
    private bool VerifyPassword(string password, string hash)
    {
        var hashOfInput = HashPassword(password);
        return hashOfInput == hash;
    }

    public async Task<UserExistsDto> EmailPhoneNoCheckAsync(LoginDto dto)
    {
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);

        var emailExists = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        var phoneExists = await _db.Users.AnyAsync(u => u.PhoneNumber == normalizedPhone);

        return new UserExistsDto
        {
            EmailExists = emailExists,
            PhoneExists = phoneExists
        };
    }
}
