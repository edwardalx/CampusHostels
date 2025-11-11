using CampusHostels.API.Domain.Entities;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public interface ITenancyRepository
{
    Task<TenancyAgreement> AddAsync(TenancyAgreement tenancy);
    Task<TenancyAgreement?> GetByIdAsync(int id);
    Task SaveChangesAsync();
}
