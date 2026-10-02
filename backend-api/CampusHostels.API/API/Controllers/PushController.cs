using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.API.Controllers;

/// <summary>Lets a signed-in manager register or remove a device for Web Push alerts.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireManager")]
public class PushController : ControllerBase
{
    private const int MaxSubscriptionsPerManager = 10;
    private const int MaxFieldLength = 2048;

    private readonly ApplicationDbContext _db;
    private readonly IPushNotificationService _push;

    public PushController(ApplicationDbContext db, IPushNotificationService push)
    {
        _db = db;
        _push = push;
    }

    public sealed class SubscribeDto
    {
        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }

    public sealed class UnsubscribeDto
    {
        public string Endpoint { get; set; } = string.Empty;
    }

    /// <summary>The VAPID public key the browser needs to subscribe. 503 when push is not configured.</summary>
    [HttpGet("public-key")]
    public IActionResult GetPublicKey() =>
        _push.IsEnabled
            ? Ok(new { publicKey = _push.PublicKey })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Push notifications are not configured." });

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeDto dto, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId)) return Unauthorized();

        if (!Uri.TryCreate(dto.Endpoint, UriKind.Absolute, out var endpoint) || endpoint.Scheme != Uri.UriSchemeHttps
            || string.IsNullOrWhiteSpace(dto.P256dh) || string.IsNullOrWhiteSpace(dto.Auth)
            || dto.Endpoint.Length > MaxFieldLength || dto.P256dh.Length > 256 || dto.Auth.Length > 64)
        {
            return BadRequest(new { error = "Invalid push subscription." });
        }

        // A device is identified by its endpoint; re-subscribing (or another manager signing in on
        // the same browser) takes the existing row over rather than duplicating it.
        var existing = await _db.ManagerPushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == dto.Endpoint, cancellationToken);
        if (existing != null)
        {
            existing.ManagerId = managerId;
            existing.P256dh = dto.P256dh;
            existing.Auth = dto.Auth;
        }
        else
        {
            var count = await _db.ManagerPushSubscriptions.CountAsync(s => s.ManagerId == managerId, cancellationToken);
            if (count >= MaxSubscriptionsPerManager)
            {
                return BadRequest(new { error = $"You can register at most {MaxSubscriptionsPerManager} devices." });
            }

            _db.ManagerPushSubscriptions.Add(new ManagerPushSubscription
            {
                ManagerId = managerId,
                Endpoint = dto.Endpoint,
                P256dh = dto.P256dh,
                Auth = dto.Auth
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    /// <summary>Sends a test alert to the signed-in manager's own devices, to confirm push works.</summary>
    [HttpPost("test")]
    public async Task<IActionResult> SendTest()
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId)) return Unauthorized();
        if (!_push.IsEnabled) return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Push notifications are not configured." });

        var delivered = await _push.SendTestAsync(managerId);
        return Ok(new { delivered });
    }

    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeDto dto, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirst("managerId")?.Value, out var managerId)) return Unauthorized();

        await _db.ManagerPushSubscriptions
            .Where(s => s.ManagerId == managerId && s.Endpoint == dto.Endpoint)
            .ExecuteDeleteAsync(cancellationToken);
        return NoContent();
    }
}
