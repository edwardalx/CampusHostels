using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces
{
    public interface IWhatsAppService
    {
        /// <summary>Send a WhatsApp message to a phone number.</summary>
        /// <param name="to">Recipient phone number (e.g., +256789123456)</param>
        /// <param name="message">Message body (text)</param>
        /// <returns>Message SID if successful, null otherwise</returns>
        Task<string?> SendMessageAsync(string to, string message);

        /// <summary>Send a template-based WhatsApp message (e.g., OTP).</summary>
        /// <param name="to">Recipient phone number</param>
        /// <param name="templateName">Template name (e.g., "otp_verification")</param>
        /// <param name="parameters">Template parameters (e.g., { "code" = "123456" })</param>
        /// <returns>Message SID if successful, null otherwise</returns>
        Task<string?> SendTemplateMessageAsync(string to, string templateName, Dictionary<string, string>? parameters = null);
    }
}
