using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CampusHostels.API.Application.Services;

public class ManagerTokenService : IManagerTokenService
{
    private readonly IConfiguration _configuration;

    public ManagerTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateToken(Manager manager, out DateTime expires)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]
                        ?? throw new Exception("JWT SecretKey not configured!");
        var issuer = jwtSettings["Issuer"] ?? "CampusHostels";
        var audience = jwtSettings["Audience"] ?? "CampusHostelsUsers";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        expires = DateTime.UtcNow.AddHours(6);

        // "scope"=manager is the actual authorization anchor (see RequireManager policy) so a
        // Tenant-issued token can never satisfy it, regardless of what that token's Role claim says.
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, manager.FirstName),
            new Claim(ClaimTypes.Email, manager.Email),
            new Claim(ClaimTypes.Role, "Manager"),
            new Claim("scope", "manager"),
            new Claim("managerId", manager.ManagerId.ToString()),
            new Claim("managerTier", manager.Tier.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
