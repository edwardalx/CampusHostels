using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.Services;

public class ManagerService : IManagerService
{
    private readonly ApplicationDbContext _db;
    private readonly IManagerTokenService _tokenService;
    private readonly ILogger<ManagerService> _logger;

    public ManagerService(ApplicationDbContext db, IManagerTokenService tokenService, ILogger<ManagerService> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<ManagerAuthResponseDto> LoginAsync(ManagerLoginDto dto)
    {
        var normalizedUsername = dto.Username?.Trim().ToLowerInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedUsername))
        {
            throw new UnauthorizedAccessException("Username is required.");
        }

        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.Username == normalizedUsername);

        if (manager is null)
        {
            throw new UnauthorizedAccessException("No manager account matches the provided username.");
        }

        if (!manager.IsActive)
        {
            throw new UnauthorizedAccessException("Manager account is inactive. Contact a Super Manager to reactivate it.");
        }

        if (manager.FailedLoginAttempts >= 5)
        {
            _logger.LogWarning("Locked out manager {Username} after {Attempts} failed attempts.", manager.Username, manager.FailedLoginAttempts);
            throw new UnauthorizedAccessException("This manager account has been locked due to multiple failed login attempts.");
        }

        if (!AccountService.VerifyPassword(dto.Password, manager.PasswordHash))
        {
            manager.FailedLoginAttempts++;
            await _db.SaveChangesAsync();
            throw new UnauthorizedAccessException("Invalid password.");
        }

        var token = _tokenService.CreateToken(manager, out var expires);
        manager.LastLoginAt = DateTime.UtcNow;
        manager.FailedLoginAttempts = 0;
        await _db.SaveChangesAsync();

        return new ManagerAuthResponseDto
        {
            Token = token,
            ManagerId = manager.ManagerId,
            Username = manager.Username,
            FirstName = manager.FirstName,
            LastName = manager.LastName,
            Email = manager.Email,
            Tier = manager.Tier.ToString(),
            // MustChangePassword = manager.MustChangePassword,
            Expires = expires
        };
    }

    public async Task<ManagerProfileDto?> GetCurrentManagerAsync(Guid managerId)
    {
        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.ManagerId == managerId);
        if (manager is null) return null;

        return new ManagerProfileDto
        {
            ManagerId = manager.ManagerId,
            Username = manager.Username,
            FirstName = manager.FirstName,
            LastName = manager.LastName,
            Email = manager.Email,
            PhoneNumber = manager.PhoneNumber,
            Tier = manager.Tier.ToString(),
            MustChangePassword = manager.MustChangePassword
        };
    }

    public async Task ChangePasswordAsync(Guid managerId, ManagerChangePasswordDto dto)
    {
        var manager = await _db.Managers.FirstOrDefaultAsync(m => m.ManagerId == managerId);
        if (manager is null)
        {
            throw new UnauthorizedAccessException("Manager not found.");
        }

        if (!AccountService.VerifyPassword(dto.CurrentPassword, manager.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        manager.PasswordHash = AccountService.HashPassword(dto.NewPassword);
        manager.MustChangePassword = false;
        manager.LastPasswordChangeAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<ManagerProfileDto> CreateManagerAsync(ManagerCreateDto dto)
    {
        var normalizedUsername = dto.Username?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedEmail = dto.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var normalizedPhone = NormalizePhone(dto.PhoneNumber ?? string.Empty);

        var existing = await _db.Managers.FirstOrDefaultAsync(m =>
            m.Username == normalizedUsername || m.Email == normalizedEmail || m.PhoneNumber == normalizedPhone);
        if (existing != null)
        {
            if (existing.Username == normalizedUsername) throw new InvalidOperationException("A manager with this username already exists.");
            if (existing.Email == normalizedEmail) throw new InvalidOperationException("A manager with this email already exists.");
            throw new InvalidOperationException("A manager with this phone number already exists.");
        }

        if (!Enum.TryParse<ManagerTier>(dto.Tier, ignoreCase: true, out var tier))
        {
            tier = ManagerTier.Standard;
        }

        var manager = new Manager
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Username = normalizedUsername,
            Email = normalizedEmail,
            PhoneNumber = normalizedPhone,
            PasswordHash = AccountService.HashPassword(dto.Password),
            Tier = tier,
            IsActive = true
        };

        _db.Managers.Add(manager);
        await _db.SaveChangesAsync();

        return new ManagerProfileDto
        {
            ManagerId = manager.ManagerId,
            Username = manager.Username,
            FirstName = manager.FirstName,
            LastName = manager.LastName,
            Email = manager.Email,
            PhoneNumber = manager.PhoneNumber,
            Tier = manager.Tier.ToString(),
            MustChangePassword = manager.MustChangePassword
        };
    }

    private static string NormalizePhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
        var hasPlus = phone.Contains('+');
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (string.IsNullOrEmpty(digits)) return string.Empty;
        return hasPlus ? "+" + digits : digits;
    }
}
