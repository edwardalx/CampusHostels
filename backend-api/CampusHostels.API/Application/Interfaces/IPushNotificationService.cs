namespace CampusHostels.API.Application.Interfaces;

public interface IPushNotificationService
{
    /// <summary>True when VAPID keys are configured; otherwise pushes are skipped.</summary>
    bool IsEnabled { get; }

    string PublicKey { get; }

    /// <summary>
    /// Pushes an alert to every subscribed device of the property's owner and of all active
    /// Super managers. Failures are logged, never thrown, so they cannot break the caller.
    /// </summary>
    Task NotifyPropertyManagersAsync(int propertyId, string title, string body, string url);

    /// <summary>Sends a test alert to the given manager's own devices; returns how many accepted it.</summary>
    Task<int> SendTestAsync(Guid managerId);
}

/// <summary>Queues manager alerts so the request that caused them does not wait on push services.</summary>
public interface IManagerActivityNotifier
{
    void Notify(int propertyId, string title, string body, string url);
}
