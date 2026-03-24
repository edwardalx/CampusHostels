using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public class EfTenancyRepository : ITenancyRepository
{
    private readonly ApplicationDbContext _db;

    public EfTenancyRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TenancyAgreement> AddAsync(TenancyAgreement tenancy)
    {
        await _db.TenancyAgreements.AddAsync(tenancy);
        return tenancy;
    }

    public async Task<TenancyAgreement?> GetByIdAsync(int id)
    {
        return await _db.TenancyAgreements
            .AsNoTracking()
            .Include(t => t.Payments)
            .Include(t => t.Unit)
            .Include(t => t.Property)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
    public async Task<List<TenancyAgreement>> GetPaidTenancyAsync(Guid tenantId)
    {
        return await _db.TenancyAgreements
            .AsNoTracking()
            .Where(t => t.TenantId == tenantId &&
                        t.TotalAmountPaid != null &&
                        t.TotalAmountPaid > 0)
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Include(t => t.User)
            .OrderByDescending(t => t.ContractStartDate)
            .ToListAsync();
    }
    public async Task<List<TenancyAgreement>> GetActiveTenanciesByUnitAsync(int propertyId, int unitId)
    {
        return await _db.TenancyAgreements
          .AsNoTracking()
          .Include(t => t.Unit)
          .Where(t => t.UnitId == unitId && t.Unit!.PropertyId == propertyId)
          .ToListAsync();
    }
    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

}
