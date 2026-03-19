using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using CampusHostels.API.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;

namespace CampusHostels.API.Application.Services
{
    // public class SmtpOptions
    // {
    //     public string Host { get; set; }
    //     public int Port { get; set; } = 25;
    //     public bool EnableSsl { get; set; } = false;
    //     public string Username { get; set; }
    //     public string Password { get; set; }
    //     public string From { get; set; }
    // }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _config = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlMessage, string? display = "Campus Hostels")
        {
            try
            {
                using var client = new SmtpClient(_config["Smtp:Host"], int.Parse(_config["Smtp:Port"] ?? "587"))
                {
                    EnableSsl = bool.Parse(_config["Smtp:EnableSsl"] ?? "true"),
                    Timeout = 30000  // 30 second timeout
                };

                if (!string.IsNullOrEmpty(_config["Smtp:Username"]) && !string.IsNullOrEmpty(_config["Smtp:Password"]))
                {
                    client.Credentials = new NetworkCredential(_config["Smtp:Username"], _config["Smtp:Password"]);
                }

                var mail = new MailMessage()
                {
                    From = new MailAddress(_config["Smtp:From"] ?? "noreply@campushostels.com", display=_config["Smtp:Display"]),
                    Subject = subject,
                    Body = htmlMessage,
                    IsBodyHtml = true
                };

                mail.To.Add(to);
                mail.ReplyToList.Add(
                new MailAddress("support@campushostels.com", "Campus Hostels Support")
                );


                _logger.LogInformation("Attempting to send email to {To} via {Host}:{Port} SSL={EnableSsl}",
                    to, _config["Smtp:Host"], _config["Smtp:Port"], _config["Smtp:EnableSsl"]);

                await client.SendMailAsync(mail);

                _logger.LogInformation("Email sent successfully to {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMTP error sending email to {To}: {Message}", to, ex.Message);
                throw;
            }
        }
    }
}