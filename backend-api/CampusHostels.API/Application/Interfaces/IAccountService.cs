using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IAccountService
{
    /// <summary>Register a new user and return auth response with token.</summary>
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);

    /// <summary>Authenticate a user by username/email and password, return auth response with token.</summary>
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserExistsDto> EmailPhoneNoCheckAsync(LoginDto dto);

    /// <summary>Update user details (phone, first name, last name).</summary>
    Task<bool> UpdateUserAsync(UpdateUserDto dto);

    Task<AuthResponseDto> GoogleLoginAsync(string accessToken);
    Task<UserLikedHostelsDto> GetUserLikedHostelsAsync(Guid tenantId);
    Task<UserLikedHostelsDto> AddLikedHostelAsync(Guid tenantId, int hostelId);
    Task<UserLikedHostelsDto> RemoveLikedHostelAsync(Guid tenantId, int hostelId);
}
