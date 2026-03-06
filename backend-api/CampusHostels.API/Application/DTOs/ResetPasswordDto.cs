using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs
{
    public class ResetPasswordDto
    {
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        [Required]
        public string? Token { get; set; }

        [Required]
        [MinLength(8)]
        public string? NewPassword { get; set; }
    }
}