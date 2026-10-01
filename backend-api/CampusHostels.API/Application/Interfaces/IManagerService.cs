using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Application.Interfaces;

public interface IManagerService
{
    Task<ManagerAuthResponseDto> LoginAsync(ManagerLoginDto dto);
    Task<ManagerProfileDto?> GetCurrentManagerAsync(Guid managerId);
    Task<ManagerProfileDto> CreateManagerAsync(ManagerCreateDto dto);
    Task<IReadOnlyList<ManagerProfileDto>> GetAllManagersAsync();
    Task<IReadOnlyList<ManagerOwnerOptionDto>> GetActiveManagerOwnerOptionsAsync();
    Task<bool> IsActiveManagerAsync(Guid managerId);
    Task<bool> CanManagePropertiesAsync(Guid managerId);
    Task<bool> CanManageUsersAsync(Guid managerId);
    Task<ManagerProfileDto> UpdateManagerAsync(Guid managerId, ManagerUpdateDto dto);
    Task ChangePasswordAsync(Guid managerId, ManagerChangePasswordDto dto);
    Task<IReadOnlyList<FunctionType>> GetFunctionsAsync(Guid managerId);
    Task<ManagerProfileDto> SetFunctionsAsync(Guid managerId, IReadOnlyCollection<FunctionType> functions);
}
