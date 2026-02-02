using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Application.DTOs;
namespace CampusHostels.API.Application.Interfaces;
public interface IPaymentGateway
{
    Task<GatewayInitResult> InitializeAsync(
        string email,
        decimal amount,
        string reference
    );

    Task<GatewayVerifyResult> VerifyAsync(string reference);
}
