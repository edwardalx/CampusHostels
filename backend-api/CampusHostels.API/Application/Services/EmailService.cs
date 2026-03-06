using SendGrid;
using SendGrid.Helpers.Mail;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Repositories;

public class EmailService
{
    private readonly string _apiKey;
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _config;
    private readonly IMessageRepository _repo;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IMessageRepository repo)
    {
        _apiKey = config["SendGrid:ApiKey"] ?? throw new InvalidOperationException("SENDGRID_API_KEY is not configured.");
        _logger = logger;
        _repo = repo;
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        var response = null as Response;
        var entity = new Message
        {
            To = toEmail,
            Content = htmlContent,
            Channel = MessageChannel.Email,
            MessageId = null,
            Success = false, // will be set after sending
            Error = null,
            SentAt = DateTime.UtcNow
        };
        var client = new SendGridClient(_apiKey);
        var msg = new SendGridMessage()
        {
            From = new EmailAddress("obeddy062@gmail.com", "Campus Hostels"),
            Subject = subject,
            HtmlContent = htmlContent
        };

        msg.AddTo(new EmailAddress(toEmail));
        try
        {
            response = await client.SendEmailAsync(msg);
            _logger.LogInformation("SendGrid Status: {StatusCode}", response.StatusCode);


           
            if (response?.StatusCode == System.Net.HttpStatusCode.Accepted)
            {
                entity.MessageId = response.Headers.TryGetValues("X-Message-Id", out var values) ? values.FirstOrDefault() : null;
                entity.Success = response?.StatusCode == System.Net.HttpStatusCode.Accepted;
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            else
            {
                var errorBody = response?.Body != null ? await response.Body.ReadAsStringAsync() : "No response body";
                _logger.LogError("Failed to send email to {ToEmail}. Status: {StatusCode}, Response: {Response}", toEmail, response?.StatusCode, errorBody);
            }
        }
        catch (Exception ex)
        {
             entity.Success = false;
             entity.Error = ex.Message;
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject '{Subject}'", toEmail, subject);

            throw; // rethrow or handle as needed
        }
        finally
        {
            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();
        }
    }
}