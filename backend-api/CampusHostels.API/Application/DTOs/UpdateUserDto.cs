using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs
{
    public class UpdateUserDto
    {
        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }
    }
}