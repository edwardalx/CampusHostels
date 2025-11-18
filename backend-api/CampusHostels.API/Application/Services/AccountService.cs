using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
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
        // Check if user already exists
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email))
        {
            throw new InvalidOperationException("Username or email already exists.");
        }

        // Create new user
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            Role = dto.Role,
            PasswordHash = HashPassword(dto.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Generate token
        var token = _tokenService.CreateToken(user, out var expires);

        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Expires = expires
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        // Find user by username or email
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username == dto.Username || u.Email == dto.Username);

        if (user is null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid username/email or password.");
        }

        // Generate token
        var token = _tokenService.CreateToken(user, out var expires);

        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
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
}
