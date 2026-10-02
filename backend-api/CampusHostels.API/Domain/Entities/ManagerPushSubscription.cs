namespace CampusHostels.API.Domain.Entities;

/// <summary>A browser or device a manager has opted in to receive Web Push alerts on.</summary>
public class ManagerPushSubscription
{
    public int Id { get; set; }

    /// <summary>The owning manager (Manager.ManagerId).</summary>
    public Guid ManagerId { get; set; }

    /// <summary>Push service URL for this browser; unique per device and acts as its identity.</summary>
    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
