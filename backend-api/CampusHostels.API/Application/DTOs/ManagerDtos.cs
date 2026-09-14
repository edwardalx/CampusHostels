using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs;

public class ManagerLoginDto
{
    [Required]
    public string Username { get; set; } = string.Empty;
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class ManagerAuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public Guid ManagerId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    // public bool MustChangePassword { get; set; }
    public DateTime Expires { get; set; }
}

public class ManagerProfileDto
{
    public Guid ManagerId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; }
}

public class ManagerChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ManagerCreateDto
{
    [Required]
    public string FirstName { get; set; } = string.Empty;
    [Required]
    public string LastName { get; set; } = string.Empty;
    [Required]
    public string Username { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string PhoneNumber { get; set; } = string.Empty;
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    // "Standard" or "Super". Only reachable by an existing Super Manager, so both are trusted choices.
    public string Tier { get; set; } = "Standard";
}
