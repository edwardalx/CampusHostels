using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Application.Interfaces;

public interface IManagerService
{
    Task<ManagerAuthResponseDto> LoginAsync(ManagerLoginDto dto);
    Task<ManagerProfileDto?> GetCurrentManagerAsync(Guid managerId);
    Task<ManagerProfileDto> CreateManagerAsync(ManagerCreateDto dto);
    Task ChangePasswordAsync(Guid managerId, ManagerChangePasswordDto dto);
    Task<IReadOnlyList<FunctionType>> GetFunctionsAsync(Guid managerId);
    Task SetFunctionsAsync(Guid managerId, IReadOnlyCollection<FunctionType> functions);
}
