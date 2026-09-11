using CampusHostels.API.Application.DTOs;

namespace CampusHostels.API.Application.Interfaces;

public interface IManagerService
{
    Task<ManagerAuthResponseDto> LoginAsync(ManagerLoginDto dto);
    Task<ManagerProfileDto?> GetCurrentManagerAsync(Guid managerId);
    Task<ManagerProfileDto> CreateManagerAsync(ManagerCreateDto dto);
    Task ChangePasswordAsync(Guid managerId, ManagerChangePasswordDto dto);
}
