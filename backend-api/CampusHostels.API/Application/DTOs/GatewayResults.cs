using System.Text.Json;

namespace CampusHostels.API.Application.DTOs;

public class GatewayInitResult
{
    public bool Success { get; set; }
    public string AuthorizationUrl { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string? Message { get; set; }
    public JsonElement? Data { get; set; }
}

public class GatewayVerifyResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public JsonElement? Data { get; set; }
}
