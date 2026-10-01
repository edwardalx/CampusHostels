using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public class EfPropertyRepository : IPropertyRepository
{
    private readonly ApplicationDbContext _db;

    public EfPropertyRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Property property)
    {
        await _db.Properties.AddAsync(property);
    }

    public async Task<IEnumerable<Property>> GetAllAsync()
    {
        return await _db.Properties.AsNoTracking().OrderBy(p => p.Id).ToListAsync();
    }

    public async Task<IEnumerable<Property>> GetForManagerAsync(Guid? ownerManagerId)
    {
        var query = _db.Properties
            .AsNoTracking()
            .Include(property => property.Units)
            .AsQueryable();

        if (ownerManagerId.HasValue)
        {
            query = query.Where(property => property.OwnerManagerId == ownerManagerId.Value);
        }

        return await query.OrderBy(property => property.Id).ToListAsync();
    }

    public async Task<Property?> GetByIdAsync(int id)
    {
        return await _db.Properties.FindAsync(id);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
