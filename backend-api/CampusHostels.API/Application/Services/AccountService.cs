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
using Google.Apis.Auth;
using System.Net.Http.Headers;
using System.Text.Json;

namespace CampusHostels.API.Application.Services;

public class AccountService : IAccountService
{
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    IConfiguration _config;

    public AccountService(ApplicationDbContext db, ITokenService tokenService, IConfiguration config)
    {
        _db = db;
        _tokenService = tokenService;
        _config = config;
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
        if (user.FailedLoginAttempts >= 5)
        {
            throw new UnauthorizedAccessException("Your account has been locked due to multiple failed login attempts. Contact support to unlock your account.");
        }

        if (!VerifyPassword(dto.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            await _db.SaveChangesAsync();

            throw new UnauthorizedAccessException("Invalid password.");
        }

        // Generate token
        var token = _tokenService.CreateToken(user, out var expires);
        user.LastLoginAt = DateTime.UtcNow;
        user.FailedLoginAttempts = 0; // reset on successful login
        await _db.SaveChangesAsync();

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
    public async Task<AuthResponseDto> GoogleLoginAsync(string accessToken)
{
    if (string.IsNullOrWhiteSpace(accessToken))
        throw new ArgumentException("accessToken is null or empty");

    using var client = new HttpClient();

    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", accessToken);

    var response = await client.GetAsync(
        "https://www.googleapis.com/oauth2/v3/userinfo"
    );

    if (!response.IsSuccessStatusCode)
    {
        var error = await response.Content.ReadAsStringAsync();
        throw new Exception($"Google token validation failed: {error}");
    }

    var json = await response.Content.ReadAsStringAsync();

    var googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(
        json,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

    if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
        throw new Exception("Unable to retrieve Google user information");

    var email = googleUser.Email.Trim().ToLowerInvariant();

    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    if (user == null)
    {
        user = new User
        {
            FirstName = googleUser.GivenName ?? googleUser.Name ?? "Google",
            LastName = googleUser.FamilyName ?? "",
            Email = email,
            TenantId = Guid.NewGuid(),
            Role = "Student",
            IsActive = true,
            PasswordHash = string.Empty,
            LastLoginAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
    }
    else
    {
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    var token = _tokenService.CreateToken(user, out var expires);

    return new AuthResponseDto
    {
        Token = token,
        TenantId = user.TenantId,
        FirstName = user.FirstName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role,
        Expires = expires
    };
}

    /// <summary>Hash a password using SHA256 (dev-only; replace with Identity later).</summary>
    public static string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    /// <summary>Verify a password against its hash.</summary>
    public static bool VerifyPassword(string password, string hash)
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

    public async Task<bool> UpdateUserAsync(UpdateUserDto dto)
    {
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null) return false;

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
            user.PhoneNumber = NormalizePhone(dto.PhoneNumber);

        if (!string.IsNullOrWhiteSpace(dto.FirstName))
            user.FirstName = dto.FirstName;

        if (!string.IsNullOrWhiteSpace(dto.LastName))
            user.LastName = dto.LastName;

        await _db.SaveChangesAsync();
        return true;
    }
}
