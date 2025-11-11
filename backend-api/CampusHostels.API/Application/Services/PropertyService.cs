using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class PropertyService : IPropertyService
{
    private readonly IPropertyRepository _repo;
    private readonly IMapper _mapper;

    public PropertyService(IPropertyRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PropertyDto>> GetAllAsync()
    {
        var items = await _repo.GetAllAsync();
        return items.Select(p => _mapper.Map<PropertyDto>(p));
    }

    public async Task<PropertyDto?> GetByIdAsync(int id)
    {
        var item = await _repo.GetByIdAsync(id);
        return item is null ? null : _mapper.Map<PropertyDto>(item);
    }

    public async Task<PropertyDto> CreateAsync(PropertyCreateDto dto)
    {
        var entity = _mapper.Map<Property>(dto);
        await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();
        return _mapper.Map<PropertyDto>(entity);
    }
}
