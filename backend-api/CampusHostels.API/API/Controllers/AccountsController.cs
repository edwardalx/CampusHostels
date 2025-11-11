using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ITokenService _tokenService;

    public AccountsController(ApplicationDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email))
            return Conflict("User with username or email already exists.");

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            Role = dto.Role
        };

        user.PasswordHash = HashPassword(dto.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(null, new { id = user.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.Username || u.Email == dto.Username);
        if (user == null) return Unauthorized();

        if (!VerifyPassword(dto.Password, user.PasswordHash)) return Unauthorized();

        var token = _tokenService.CreateToken(user, out var expires);
        user.RefreshToken = GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _db.SaveChangesAsync();

        return Ok(new AuthResponseDto { Token = token, Username = user.Username, Email = user.Email, Role = user.Role, Expires = expires });
    }

    // Simple password hash using SHA256 (replace with stronger algorithm in production)
    private static string HashPassword(string pwd)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(pwd));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string pwd, string hash)
    {
        return HashPassword(pwd) == hash;
    }

    private static string GenerateRefreshToken()
    {
        var random = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(random);
    }
}
