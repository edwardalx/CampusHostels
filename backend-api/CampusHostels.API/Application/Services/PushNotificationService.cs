using System.Text.Json;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using WebPush;

namespace CampusHostels.API.Application.Services;

public class PushNotificationService : IPushNotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly WebPushClient _client;
    private readonly VapidDetails? _vapid;

    public PushNotificationService(
        ApplicationDbContext db,
        HttpClient httpClient,
        IConfiguration config,
        ILogger<PushNotificationService> logger)
    {
        _db = db;
        _logger = logger;
        _client = new WebPushClient(httpClient);

        var publicKey = config["WebPush:PublicKey"];
        var privateKey = config["WebPush:PrivateKey"];
        var subject = config["WebPush:Subject"];
        if (!string.IsNullOrWhiteSpace(publicKey) && !string.IsNullOrWhiteSpace(privateKey) && !string.IsNullOrWhiteSpace(subject))
        {
            _vapid = new VapidDetails(subject, publicKey, privateKey);
        }
    }

    public bool IsEnabled => _vapid != null;

    public string PublicKey => _vapid?.PublicKey ?? string.Empty;

    public async Task NotifyPropertyManagersAsync(int propertyId, string title, string body, string url)
    {
        if (_vapid == null)
        {
            _logger.LogWarning("Push skipped for property {PropertyId}: WebPush keys are not configured", propertyId);
            return;
        }

        try
        {
            var ownerId = await _db.Properties
                .AsNoTracking()
                .Where(p => p.Id == propertyId)
                .Select(p => p.OwnerManagerId)
                .FirstOrDefaultAsync();

            var subscriptions = await (
                from sub in _db.ManagerPushSubscriptions
                join manager in _db.Managers on sub.ManagerId equals manager.ManagerId
                where manager.IsActive && (manager.Tier == ManagerTier.Super || manager.ManagerId == ownerId)
                select sub).ToListAsync();

            await SendAsync(subscriptions, title, body, url, $"property {propertyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sending manager push notifications failed");
        }
    }

    public async Task<int> SendTestAsync(Guid managerId)
    {
        if (_vapid == null) return 0;

        var subscriptions = await _db.ManagerPushSubscriptions.Where(s => s.ManagerId == managerId).ToListAsync();
        return await SendAsync(subscriptions, "Test alert", "Push alerts are working on this device.", "/manager/", "test");
    }

    private async Task<int> SendAsync(List<ManagerPushSubscription> subscriptions, string title, string body, string url, string reason)
    {
        if (subscriptions.Count == 0)
        {
            _logger.LogInformation("Push for {Reason}: no subscribed devices to notify", reason);
            return 0;
        }

        var payload = JsonSerializer.Serialize(new { title, body, url });
        var expired = new List<ManagerPushSubscription>();
        var delivered = 0;

        foreach (var sub in subscriptions)
        {
            try
            {
                await _client.SendNotificationAsync(new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth), payload, _vapid!);
                delivered++;
            }
            catch (WebPushException ex) when (ex.StatusCode is System.Net.HttpStatusCode.Gone or System.Net.HttpStatusCode.NotFound)
            {
                // The browser revoked or expired this subscription.
                expired.Add(sub);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Push delivery failed for subscription {SubscriptionId}", sub.Id);
            }
        }

        if (expired.Count > 0)
        {
            _db.ManagerPushSubscriptions.RemoveRange(expired);
            await _db.SaveChangesAsync();
        }

        _logger.LogInformation("Push for {Reason}: {Delivered}/{Total} devices accepted, {Expired} expired subscriptions removed",
            reason, delivered, subscriptions.Count, expired.Count);
        return delivered;
    }
}

public class ManagerActivityNotifier : IManagerActivityNotifier
{
    private readonly IBackgroundJobClient _jobs;

    public ManagerActivityNotifier(IBackgroundJobClient jobs)
    {
        _jobs = jobs;
    }

    public void Notify(int propertyId, string title, string body, string url)
    {
        try
        {
            _jobs.Enqueue<IPushNotificationService>(s => s.NotifyPropertyManagersAsync(propertyId, title, body, url));
        }
        catch
        {
            // Alerts are best-effort; a queueing failure must never fail the booking, payment or request.
        }
    }
}
