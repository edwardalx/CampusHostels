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
        return await _db.TenancyAgreements.FindAsync(id);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
