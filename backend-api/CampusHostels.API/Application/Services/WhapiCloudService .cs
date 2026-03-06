using System.Net.Http;
using System.Text;
using System.Text.Json;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.Extensions.Logging;

public class WhatsAppService : IWhatsAppService
{
    private readonly HttpClient _httpClient;
    private readonly IMessageRepository _repo;
    private readonly string? _token;
    private readonly string _baseUrl;
    private readonly ILogger<WhatsAppService> _logger;
    private string FormatPhoneNumber(string phone)
    {
        return phone.Replace("+", ""); // only digits
    }
    public WhatsAppService(HttpClient httpClient, IConfiguration config, ILogger<WhatsAppService> logger, IMessageRepository repo)
    {
        _httpClient = httpClient;
        _repo = repo;
        // Read from configuration (which includes .env, appsettings.json, env vars)
        _token = config["Whapi:Token"] ?? throw new InvalidOperationException("Whapi:Token not configured");
        _baseUrl = config["Whapi:BaseUrl"] ?? "https://gate.whapi.cloud/";
        _logger = logger;
        if (string.IsNullOrWhiteSpace(_token))
            throw new InvalidOperationException("WHAPI_TOKEN is not configured.");

        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _token);
    }
    private async Task<WhatsAppSendResult?> PostAsync(string endpoint, object payload)
    {
        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(endpoint, content);

        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("WhatsApp API Error: {Response}", json);
            response.EnsureSuccessStatusCode();
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<WhatsAppSendResult>(json, options);
    }
    public async Task<WhatsAppSendResult> SendTextMessageAsync(string to, string message)
    {
        try
        {
            var payload = new
            {
                to = FormatPhoneNumber(to),
                body = message,
                typing_time = 1, // Show typing for 5 seconds
                preview_url = true // Auto-expand URLs
            };

            var response = await PostAsync("/messages/text", payload);
            _logger.LogInformation("Successfully sent WhatsApp message to {To}", to);
            _logger.LogInformation("WhatsApp API response: {@Response}", response);
            var entity = new Message
            {
                To = to,
                Content = message,
                Channel = MessageChannel.WhatsApp,
                MessageId = response?.message?.id,
                Success = response?.sent == true,
                Error = null,
                SentAt = DateTime.UtcNow
            };

            await _repo.AddAsync(entity);
            await _repo.SaveChangesAsync();

            return new WhatsAppSendResult
            {
                Success = response?.sent == true,
                message = response?.message,
                Timestamp = DateTime.UtcNow
            };

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send text message to {To}", to);
            return new WhatsAppSendResult
            {
                Success = false,
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            };
        }
    }

}