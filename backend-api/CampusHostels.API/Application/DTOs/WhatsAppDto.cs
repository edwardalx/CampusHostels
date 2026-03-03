using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.DTOs;

public class WhatsAppSendRequest
{
    public string To { get; set; } = null!;
    public string Message { get; set; } = null!;
}
public class WhapiMessage
{
    public string? id { get; set; }
}
public class WhatsAppSendResult
{
    public bool sent { get; set; }
    public WhapiMessage? message { get; set; }  // <-- single object
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}