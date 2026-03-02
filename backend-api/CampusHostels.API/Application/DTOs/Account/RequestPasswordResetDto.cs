using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs.Account
{
    public class RequestPasswordResetDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        // Optional: base url used in the email link (e.g. https://yourapp.com/reset-password)
        public string ResetUrlBase { get; set; }
    }
}
