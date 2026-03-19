using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.BackgroundServices;

public class TenancyJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<TenancyJob> _logger;
    private readonly ITenancyRepository _repo;

    public TenancyJob(ApplicationDbContext db, ILogger<TenancyJob> logger, ITenancyRepository repo)
    {
        _db = db;
        _logger = logger;
        _repo = repo;
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
            var activeTenancies = await _repo.GetActiveTenanciesByUnitAsync(tenancy.UnitId);
            var maxNoOfTenants = tenancies.FirstOrDefault()?.Unit?.MaxNoOfPeople ?? 0;

            // ❌ Expired
            if (tenancy.ContractEndDate < today && tenancy.IsActive)
            {
                tenancy.IsActive = false;

                var activeTenants = activeTenancies.Count(t => t.ContractEndDate >= DateTime.UtcNow && t.TotalAmountPaid != null);

                if (activeTenants < maxNoOfTenants && tenancy.Unit != null)
                {
                    tenancy.Unit.Availability = true;
                }
                // if (tenancy.Unit != null)
                // {
                //     tenancy.Unit.Availability = true;
                // }

                _logger.LogInformation($"Tenancy ended for {tenancy.User?.Email}");
            }
        }

        await _db.SaveChangesAsync();
    }
}