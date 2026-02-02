using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IPaystackService
{
    Task<(string AuthorizationUrl, string Reference)> InitializeTransactionAsync(decimal amount, string email, string callbackUrl, string reference, string currency = "GHS", object? metadata = null);
    Task<bool> VerifyTransactionAsync(string reference);
    Task<bool> ValidateWebhookSignatureAsync(string payload, string signatureHeader);
}
