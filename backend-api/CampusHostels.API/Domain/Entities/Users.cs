using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    [Required]
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    [Required]
    public string Role { get; set; } = "Tenant"; // Tenant, Admin, Manager
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastPasswordChangeAt { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public bool IsActive { get; set; } = false;
}