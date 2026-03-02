using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using CampusHostels.API.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusHostels.API.Application.Services
{
    public class SmtpOptions
    {
        public string Host { get; set; }
        public int Port { get; set; } = 25;
        public bool EnableSsl { get; set; } = false;
        public string Username { get; set; }
        public string Password { get; set; }
        public string From { get; set; }
    }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpOptions _options;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlMessage)
        {
            try
            {
                using var client = new SmtpClient(_options.Host, _options.Port)
                {
                    EnableSsl = _options.EnableSsl,
                    Timeout = 30000  // 30 second timeout
                };

                if (!string.IsNullOrEmpty(_options.Username))
                {
                    client.Credentials = new NetworkCredential(_options.Username, _options.Password);
                }

                var mail = new MailMessage()
                {
                    From = new MailAddress(_options.From),
                    Subject = subject,
                    Body = htmlMessage,
                    IsBodyHtml = true
                };

                mail.To.Add(to);
                
                _logger.LogInformation("Attempting to send email to {To} via {Host}:{Port} SSL={EnableSsl}", 
                    to, _options.Host, _options.Port, _options.EnableSsl);
                
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
