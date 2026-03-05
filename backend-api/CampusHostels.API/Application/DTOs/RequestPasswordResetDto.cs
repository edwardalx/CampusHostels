using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs
{
    public class RequestPasswordResetDto
    {
     
        public string? Email { get; set; }

        public string? PhoneNumber { get; set; }

        // Optional: base url used in the email link (e.g. https://yourapp.com/reset-password)
        public string? ResetUrlBase { get; set; }
    }
}