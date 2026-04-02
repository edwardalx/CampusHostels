using System.ComponentModel.DataAnnotations;
namespace CampusHostels.API.Application.DTOs;


public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RegisterDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    // default false; client may set true (e.g. by ticking a box)
    public bool IsActive { get; set; } = false;
    public string Role { get; set; } = "Tenant";
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime Expires { get; set; }
}

public class UserExistsDto
{
    public bool EmailExists { get; set; } = false;
    public bool PhoneExists { get; set; } = false;
}

public class GoogleAuthDto
{
    public string IdToken { get; set; } = string.Empty;
}