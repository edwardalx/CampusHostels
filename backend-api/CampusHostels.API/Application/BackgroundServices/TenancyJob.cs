using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.BackgroundServices;

public class TenancyJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<TenancyJob> _logger;
    private readonly ITenancyRepository _repo;
    private readonly IUnitRepository _unitRepo;

    public TenancyJob(ApplicationDbContext db, ILogger<TenancyJob> logger, ITenancyRepository repo, IUnitRepository unitRepo)
    {
        _db = db;
        _logger = logger;
        _repo = repo;
        _unitRepo = unitRepo;
    }

    public async Task CheckTenancies()
    {
        var today = DateTime.UtcNow.Date;
        _logger.LogInformation($"I'm testing Hangfire running at {DateTime.UtcNow}");
        var tenancies = _db.TenancyAgreements
            .Include(t => t.Unit)
            .Include(t => t.User)
            .ToList();
        var paidTenancies = tenancies.Where(t => t.TotalAmountPaid != null);
        foreach (var tenancy in paidTenancies)
        {
            // 🔔 Expiring soon
            var daysLeft = (tenancy.ContractEndDate - today)?.TotalDays;

            if (daysLeft <= 7 && daysLeft > 0)
            {
                _logger.LogInformation($"Reminder: {tenancy.User?.Email} expires in {daysLeft} days");
            }
            var activeTenancies = await _repo.GetActiveTenanciesByUnitAsync(tenancy.Unit!.PropertyId, tenancy.UnitId);
            var unitOfPaid = await _unitRepo.GetByIdAsync(tenancy.UnitId);
            // var maxNoOfTenants = tenancies.FirstOrDefault()?.Unit?.MaxNoOfPeople ?? 0;
            var maxNoOfTenants = unitOfPaid!.MaxNoOfPeople ?? 0;
            _logger.LogInformation($"active tenants:{activeTenancies.Count(t => t.ContractEndDate >= DateTime.UtcNow && t.TotalAmountPaid != null)} max no tenants:{maxNoOfTenants}");
            var activeTenants = activeTenancies.Count(t => t.ContractEndDate >= today && t.TotalAmountPaid != null);
            tenancy.Unit.BedsLeft = tenancy.Unit.MaxNoOfPeople - activeTenants;
            // ❌ Expired
            if (tenancy.ContractEndDate < today && tenancy.IsActive)
            {
                tenancy.IsActive = false;


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
        var allUnits = await _unitRepo.GetAllUnitsAsync();
        foreach (var unit in allUnits)
        {
            unit.BedsLeft ??= unit.MaxNoOfPeople;
        }

        await _db.SaveChangesAsync();
    }
}