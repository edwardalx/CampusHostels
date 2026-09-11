using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.BackgroundServices;

public class ManagerPasswordExpiryJob
{
    private const int PasswordMaxAgeDays = 90;

    private readonly ApplicationDbContext _db;
    private readonly ILogger<ManagerPasswordExpiryJob> _logger;

    public ManagerPasswordExpiryJob(ApplicationDbContext db, ILogger<ManagerPasswordExpiryJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    // Super Managers are intentionally exempt from the recurring 90-day rotation — only the
    // one-time first-login change (Manager.MustChangePassword defaults to true) applies to them.
    public async Task EnforcePasswordRotation()
    {
        var cutoff = DateTime.UtcNow.AddDays(-PasswordMaxAgeDays);

        var expiredManagers = await _db.Managers
            .Where(m => m.Tier == ManagerTier.Standard
                        && !m.MustChangePassword
                        && m.LastPasswordChangeAt != null
                        && m.LastPasswordChangeAt < cutoff)
            .ToListAsync();

        foreach (var manager in expiredManagers)
        {
            manager.MustChangePassword = true;
            _logger.LogInformation("Flagged manager {Username} for password rotation (last changed {LastChanged}).", manager.Username, manager.LastPasswordChangeAt);
        }

        if (expiredManagers.Count > 0)
        {
            await _db.SaveChangesAsync();
        }
    }
}
