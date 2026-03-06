using System;
using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Domain.Entities
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        [Required]
        public int UserId { get; set; }
        [Required]
        public string TokenHash { get; set; } = string.Empty; // SHA256 hash of token
        public DateTime ExpiresAt { get; set; }
        public bool Used { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}