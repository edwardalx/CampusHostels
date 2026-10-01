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

namespace CampusHostels.API.Application.Services;

public class AccountService : IAccountService
{
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AccountService> _logger;
    IConfiguration _config;

    public AccountService(ApplicationDbContext db, ITokenService tokenService, ILogger<AccountService> logger, IConfiguration config)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
        _config = config;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Normalize inputs
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);

        // Single DB call to check for existing user by email or phone
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail || (normalizedPhone != "" && u.PhoneNumber == normalizedPhone));
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
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail) ?? (normalizedPhone.Length > 0 ? await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone) : null);

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
            _logger.LogWarning($"Locked out user {user.Email} after {user.FailedLoginAttempts} failed attempts.");

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
    public async Task<AuthResponseDto> GoogleLoginAsync(string idToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            throw new ArgumentException("idToken is required.");

        var clientId = _config["Authentication:GoogleClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            throw new InvalidOperationException("Google sign-in is not available right now.");

        // Verifies the signature against Google's published keys, the expiry, the issuer and that the
        // token was issued to THIS application (audience), so tokens minted for other apps are rejected.
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Rejected an invalid Google ID token.");
            throw new UnauthorizedAccessException("Google sign-in failed. Please try again.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email) || !payload.EmailVerified)
            throw new UnauthorizedAccessException("Your Google account's email address is not verified.");

        var email = payload.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            user = new User
            {
                FirstName = payload.GivenName ?? payload.Name ?? "Google",
                LastName = payload.FamilyName ?? string.Empty,
                Email = email,
                TenantId = Guid.NewGuid(),
                // No phone number yet; they add one when they book. Uniqueness only applies to
                // non-empty phone numbers (see ApplicationDbContext).
                PhoneNumber = string.Empty,
                Role = "Tenant",
                // Google has verified the address, so there is nothing further to activate.
                IsActive = true,
                // Google-only account: an empty hash can never match a password.
                PasswordHash = string.Empty,
                LastLoginAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Two first-time sign-ins racing: the other request created the account.
                _db.Entry(user).State = EntityState.Detached;
                user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new InvalidOperationException("Unable to create the account.");
            }
        }

        // Same account rules as password sign-in.
        if (!user.IsActive)
            throw new UnauthorizedAccessException("User account is inactive. Contact support to activate your account.");

        if (user.FailedLoginAttempts >= 5)
            throw new UnauthorizedAccessException("Your account has been locked due to multiple failed login attempts. Contact support to unlock your account.");

        user.LastLoginAt = DateTime.UtcNow;
        user.FailedLoginAttempts = 0;
        await _db.SaveChangesAsync();

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
        // Google-created accounts have a blank phone number, which must never count as "taken".
        var phoneExists = normalizedPhone.Length > 0 && await _db.Users.AnyAsync(u => u.PhoneNumber == normalizedPhone);

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

    public async Task<UserLikedHostelsDto> GetUserLikedHostelsAsync(Guid tenantId)
    {
        var user = await _db.Users
            .Include(u => u.LikedHostels)
            .FirstOrDefaultAsync(u => u.TenantId == tenantId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }
        return new UserLikedHostelsDto
        {
            LikedHostelIds = user.LikedHostels.Select(h => h.Id).ToList()
        };
    }
    public async Task<UserLikedHostelsDto> AddLikedHostelAsync(Guid tenantId, int hostelId)
    {
        var user = await _db.Users
            .Include(u => u.LikedHostels)
            .FirstOrDefaultAsync(u => u.TenantId == tenantId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var hostel = await _db.Properties.FindAsync(hostelId);
        if (hostel == null)
        {
            throw new InvalidOperationException("Hostel not found.");
        }

        if (!user.LikedHostels.Any(h => h.Id == hostel.Id))
        {
            user.LikedHostels.Add(hostel);
            await _db.SaveChangesAsync();
        }

        return new UserLikedHostelsDto
        {
            LikedHostelIds = user.LikedHostels.Select(h => h.Id).ToList()
        };
    }

    public async Task<UserLikedHostelsDto> RemoveLikedHostelAsync(Guid tenantId, int hostelId)
    {
        var user = await _db.Users
            .Include(u => u.LikedHostels)
            .FirstOrDefaultAsync(u => u.TenantId == tenantId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found.");
        }

        var hostel = user.LikedHostels.FirstOrDefault(h => h.Id == hostelId);
        if (hostel != null)
        {
            user.LikedHostels.Remove(hostel);
            await _db.SaveChangesAsync();
        }

        return new UserLikedHostelsDto
        {
            LikedHostelIds = user.LikedHostels.Select(h => h.Id).ToList()
        };
    }
}
