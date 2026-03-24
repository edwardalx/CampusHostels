using CampusHostels.API.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public interface IUnitRepository
{
    Task<IEnumerable<Unit>> GetByPropertyIdAsync(int propertyId);
    Task<Unit?> GetByIdAsync(int id);
    Task<IEnumerable<Unit>>GetAllUnitsAsync();
    Task AddAsync(Unit unit);
    Task SaveChangesAsync();

}
