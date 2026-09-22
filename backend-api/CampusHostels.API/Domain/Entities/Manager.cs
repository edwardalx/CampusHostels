using System.ComponentModel.DataAnnotations;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Domain.Entities;

public class Manager
{
    public int Id { get; set; }
    public Guid ManagerId { get; set; } = Guid.NewGuid();
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
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    [Required]
    public ManagerTier Tier { get; set; } = ManagerTier.Standard;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    // True on creation (seeded or created via the grant endpoint) so every manager must set their
    // own password on first login. Also flipped back to true every 90 days for Standard managers
    // by ManagerPasswordExpiryJob — Super Managers are exempt from the recurring rotation.
    public bool MustChangePassword { get; set; } = true;
    public DateTime? LastPasswordChangeAt { get; set; }
    public List<ManagerFunction> Functions { get; set; } = new();
}
