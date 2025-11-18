using CampusHostels.API.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IUnitService
{
    Task<IEnumerable<UnitDto>> GetByPropertyAsync(int propertyId);
    Task<UnitDto?> GetByIdAsync(int id);
    Task<UnitDto> CreateAsync(int propertyId, UnitCreateDto dto);
}
