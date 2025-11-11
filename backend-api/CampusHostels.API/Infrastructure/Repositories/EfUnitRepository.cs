using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public class EfUnitRepository : IUnitRepository
{
    private readonly ApplicationDbContext _db;

    public EfUnitRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Unit unit)
    {
        await _db.Units.AddAsync(unit);
    }

    public async Task<Unit?> GetByIdAsync(int id)
    {
        return await _db.Units.FindAsync(id);
    }

    public async Task<IEnumerable<Unit>> GetByPropertyIdAsync(int propertyId)
    {
        return await _db.Units.Where(u => u.PropertyId == propertyId).AsNoTracking().ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
