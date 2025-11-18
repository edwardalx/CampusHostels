using CampusHostels.API.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IPropertyService
{
    Task<IEnumerable<PropertyDto>> GetAllAsync();
    Task<PropertyDto?> GetByIdAsync(int id);
    Task<PropertyDto> CreateAsync(PropertyCreateDto dto);
}
