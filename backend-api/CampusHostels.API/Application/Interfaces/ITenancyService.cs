using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface ITenancyService
{
    Task<TenancyAgreement> CreateAsync(TenancyCreateDto dto, Guid tenantId);
    Task<TenancyDetailsDto?> GetByIdAsync(int id);
    Task<List<PaidTenancyDto>> GetPaidTenancyAsync(Guid tenantId);
}
