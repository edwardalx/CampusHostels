using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CampusHostels.API.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace CampusHostels.API.Infrastructure.Services
{
    public class TwilioWhatsAppOptions
    {
        public string AccountSid { get; set; } = string.Empty;
        public string AuthToken { get; set; } = string.Empty;
        public string FromPhoneNumber { get; set; } = string.Empty; // e.g., +1234567890
    }

    public class TwilioWhatsAppService : IWhatsAppService
    {
        private readonly TwilioWhatsAppOptions _options;
        private readonly ILogger<TwilioWhatsAppService> _logger;

        public TwilioWhatsAppService(IOptions<TwilioWhatsAppOptions> options, ILogger<TwilioWhatsAppService> logger)
        {
            _options = options.Value;
            _logger = logger;

            if (string.IsNullOrWhiteSpace(_options.AccountSid) || string.IsNullOrWhiteSpace(_options.AuthToken))
            {
                _logger.LogWarning("Twilio WhatsApp not fully configured. Calls will be no-ops.");
                return;
            }

            TwilioClient.Init(_options.AccountSid, _options.AuthToken);
        }

        public async Task<string?> SendMessageAsync(string to, string message)
        {
            if (string.IsNullOrWhiteSpace(_options.AccountSid))
            {
                _logger.LogWarning("Twilio not configured; skipping WhatsApp send to {To}", to);
                return null;
            }

            try
            {
                // Twilio WhatsApp format: From "whatsapp:+1234567890", To "whatsapp:+1234567890"
                var messageResource = await MessageResource.CreateAsync(
                    from: new PhoneNumber($"whatsapp:{_options.FromPhoneNumber}"),
                    to: new PhoneNumber($"whatsapp:{to}"),
                    body: message
                );

                _logger.LogInformation("WhatsApp message sent to {To}; SID: {Sid}", to, messageResource.Sid);
                return messageResource.Sid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send WhatsApp message to {To}", to);
                return null;
            }
        }

        public async Task<string?> SendTemplateMessageAsync(string to, string templateName, Dictionary<string, string>? parameters = null)
        {
            if (string.IsNullOrWhiteSpace(_options.AccountSid))
            {
                _logger.LogWarning("Twilio not configured; skipping WhatsApp template send to {To}", to);
                return null;
            }

            try
            {
                // Note: Twilio's native template API is limited. For advanced templates (e.g., with media),
                // you may need to use Meta's Official WhatsApp Business API directly.
                // For now, interpolate parameters into a composed message.
                var message = ComposeTemplateMessage(templateName, parameters);

                return await SendMessageAsync(to, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send WhatsApp template to {To}", to);
                return null;
            }
        }

        private static string ComposeTemplateMessage(string templateName, Dictionary<string, string>? parameters)
        {
            return templateName switch
            {
                "otp_verification" => $"Your OTP is: {parameters?.GetValueOrDefault("code", "N/A")}",
                "password_reset" => $"Reset your password here: {parameters?.GetValueOrDefault("resetLink", "N/A")}. Link expires in 1 hour.",
                "booking_confirmation" => $"Your booking is confirmed! Reference: {parameters?.GetValueOrDefault("reference", "N/A")}",
                _ => parameters?.GetValueOrDefault("message", "Hello from CampusHostels!") ?? "Hello from CampusHostels!"
            };
        }
    }
}
