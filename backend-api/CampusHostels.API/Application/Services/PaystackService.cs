using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using CampusHostels.API.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CampusHostels.API.Application.Services;

public class PaystackService : IPaystackService
{
    private readonly HttpClient _http;
    private readonly string _secretKey;

    public PaystackService(HttpClient http, IConfiguration cfg)
    {
        _http = http;
        _secretKey = cfg["PAYSTACK_SECRET_KEY"]
          ?? cfg["Paystack:SecretKey"]
          ?? throw new Exception("Paystack secret key not configured");

    }

    public async Task<(string AuthorizationUrl, string Reference)> InitializeTransactionAsync(decimal amount, string email, string callbackUrl, string clientReference, string currency = "GHS", object? metadata = null)
    {
        if (currency != "GHS" && currency != "NGN")
            throw new ArgumentException("Unsupported currency. Only GHS and NGN are supported.");

        // Paystack expects amount in the smallest currency unit (kobo for NGN)
        var payload = new
        {
            amount = (int)(Math.Round(amount, 2) * 100m),
            email,
            reference = clientReference,
            currency = currency,
            callback_url = callbackUrl,
            channels = currency switch
            {
                "GHS" => new[] { "card", "mobile_money_ghana" }, // <-- GHS channels
                "NGN" => new[] { "card", "bank", "ussd" },       // NGN channels
                _ => new[] { "card" }                            // fallback
            },
            metadata
        };

        using var resp = await _http.PostAsJsonAsync("transaction/initialize", payload);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new Exception($"Paystack initialize failed: {resp.StatusCode} - {body}");

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var success = root.GetProperty("status").GetBoolean();
        if (!success)
            throw new Exception("Paystack initialize returned unsuccessful status");

        var data = root.GetProperty("data");
        var authUrl = data.GetProperty("authorization_url").GetString() ?? string.Empty;
        var paystackRef = data.GetProperty("reference").GetString() ?? string.Empty;

        return (authUrl, paystackRef);
    }

    public async Task<(bool IsValid, string? Channel, string? GatewayResponse)> VerifyTransactionAsync(string reference)
    {
        try
        {
            using var resp = await _http.GetAsync($"transaction/verify/{reference}");
            var body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
                return (false, null, null);

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!root.GetProperty("status").GetBoolean())
                return (false, null, null);

            var data = root.GetProperty("data");

            var status = data.GetProperty("status").GetString() ?? string.Empty;
            var isValid = string.Equals(status, "success", StringComparison.OrdinalIgnoreCase);

            // Extract channel - use Paystack's value directly
            string? channel = null;
            if (data.TryGetProperty("channel", out var channelElement))
            {
                channel = channelElement.GetString();
            }

            // Extract gateway response
            string? gatewayResponse = null;
            if (data.TryGetProperty("gateway_response", out var gatewayElement))
            {
                gatewayResponse = gatewayElement.GetString();
            }

            // For mobile money, you might want the specific provider
            if (channel == "mobile_money" && data.TryGetProperty("authorization", out var authElement))
            {
                if (authElement.TryGetProperty("mobile_money", out var mmElement))
                {
                    if (mmElement.TryGetProperty("provider", out var providerElement))
                    {
                        // Use the specific provider (MTN, Vodafone, etc.)
                        channel = providerElement.GetString();
                    }
                }
            }

            return (isValid, channel, gatewayResponse);
        }
        catch (Exception ex)
        {
            return (false, null, $"Verification error: {ex.Message}");
        }
    }
    public Task<bool> ValidateWebhookSignatureAsync(string payload, string signatureHeader)
    {
        if (string.IsNullOrEmpty(_secretKey)) return Task.FromResult(false);

        var secret = Encoding.UTF8.GetBytes(_secretKey);
        using var hmac = new HMACSHA512(secret);
        var computed = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedHex = BitConverter.ToString(computed).Replace("-", string.Empty).ToLowerInvariant();

        var received = signatureHeader?.Trim().ToLowerInvariant() ?? string.Empty;
        return Task.FromResult(computedHex == received);
    }
}
