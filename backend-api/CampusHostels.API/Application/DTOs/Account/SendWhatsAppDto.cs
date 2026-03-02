using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.Application.DTOs.Account
{
    public class SendWhatsAppDto
    {
        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;
    }

    public class SendWhatsAppTemplateDto
    {
        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string TemplateName { get; set; } = string.Empty;

        // Optional key-value pairs for template interpolation (e.g., { "code": "123456" })
        public Dictionary<string, string>? Parameters { get; set; }
    }

    public class WhatsAppResponseDto
    {
        public string? MessageSid { get; set; }
        public bool Success { get; set; }
        public string? Message { get; set; }
    }
}
