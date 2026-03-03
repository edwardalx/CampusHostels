using  CampusHostels.API.Application.DTOs;
// Application/Interfaces/IWhatsAppService.cs
namespace CampusHostels.API.Application.Interfaces;

public interface IWhatsAppService
{
    // Text messages
    Task<WhatsAppSendResult> SendTextMessageAsync(string to, string message);
}