using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs
{
    public class RequestPasswordResetDto
    {
     
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }
    }
}