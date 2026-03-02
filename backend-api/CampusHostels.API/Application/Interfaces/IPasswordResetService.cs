using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs.Account;

namespace CampusHostels.API.Application.Interfaces;

    public interface IPasswordResetService
    {
        Task RequestPasswordResetAsync(RequestPasswordResetDto dto);
        Task<bool> VerifyResetTokenAsync(string email, string token);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
    }

