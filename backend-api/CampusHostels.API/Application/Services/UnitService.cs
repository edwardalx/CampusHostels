using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class UnitService : IUnitService
{
    private readonly IUnitRepository _repo;
    private readonly IMapper _mapper;

    public UnitService(IUnitRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<UnitDto>> GetByPropertyAsync(int propertyId)
    {
        var items = await _repo.GetByPropertyIdAsync(propertyId);
        return items.Select(u => _mapper.Map<UnitDto>(u));
    }

    public async Task<UnitDto?> GetByIdAsync(int id)
    {
        var item = await _repo.GetByIdAsync(id);
        return item is null ? null : _mapper.Map<UnitDto>(item);
    }

    public async Task<UnitDto> CreateAsync(int propertyId, UnitCreateDto dto)
    {
        var entity = _mapper.Map<Unit>(dto);
        entity.PropertyId = propertyId;
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        return _mapper.Map<UnitDto>(entity);
    }
}
