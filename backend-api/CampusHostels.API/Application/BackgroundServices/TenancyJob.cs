using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.BackgroundServices;

public class TenancyJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<TenancyJob> _logger;

    public TenancyJob(ApplicationDbContext db, ILogger<TenancyJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task CheckTenancies()
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation($"I'm testing Hangfire running at {DateTime.UtcNow}");
        var tenancies = _db.TenancyAgreements
            .Include(t => t.Unit)
            .Include(t => t.User)
            .ToList();

        foreach (var tenancy in tenancies)
        {
            // 🔔 Expiring soon
            var daysLeft = (tenancy.ContractEndDate - today)?.TotalDays;

            if (daysLeft <= 7 && daysLeft > 0)
            {
                _logger.LogInformation($"Reminder: {tenancy.User?.Email} expires in {daysLeft} days");
            }

            // ❌ Expired
            if (tenancy.ContractEndDate < today && tenancy.IsActive)
            {
                tenancy.IsActive = false;
                if (tenancy.Unit != null)
                {
                    tenancy.Unit.Availability = true;
                }

                _logger.LogInformation($"Tenancy ended for {tenancy.User?.Email}");
            }
        }

        await _db.SaveChangesAsync();
    }
}