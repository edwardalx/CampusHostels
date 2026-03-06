using CampusHostels.API.Domain.Enums;
namespace CampusHostels.API.Domain.Entities;

public class Message
{
    public int Id { get; set; }
    public string To { get; set; } = null!;
    public string Content { get; set; } = null!;
    public MessageChannel Channel { get; set; }
    public string? MessageId { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime SentAt { get; set; }
}