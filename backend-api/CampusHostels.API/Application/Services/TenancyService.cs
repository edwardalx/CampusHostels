using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Repositories;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class TenancyService : ITenancyService
{
    private readonly ITenancyRepository _repo;
    private readonly IMapper _mapper;

    public TenancyService(ITenancyRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

  public async Task<TenancyAgreement> CreateAsync(
    TenancyCreateDto dto,
    Guid tenantId
)
{
    var entity = _mapper.Map<TenancyAgreement>(dto);

    entity.TenantId = tenantId;
    entity.ComputeContractEndDate();

    var created = await _repo.AddAsync(entity);
    await _repo.SaveChangesAsync();

    return created;
}

    public Task<TenancyAgreement?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
}
