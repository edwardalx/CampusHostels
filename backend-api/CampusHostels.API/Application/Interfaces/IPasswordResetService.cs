using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs;

namespace CampusHostels.API.Application.Interfaces;

    public interface IPasswordResetService
    {
        Task RequestPasswordResetAsync(RequestPasswordResetDto dto);
        Task<bool> VerifyResetTokenAsync(ResetPasswordDto dto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
    }
