using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs.Account
{
    public class UpdateUserDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }
    }
}
