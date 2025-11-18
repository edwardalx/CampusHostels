using CampusHostels.API.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public interface IPropertyRepository
{
    Task<IEnumerable<Property>> GetAllAsync();
    Task<Property?> GetByIdAsync(int id);
    Task AddAsync(Property property);
    Task SaveChangesAsync();
}
