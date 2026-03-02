using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

    public interface IEmailSender
    {
        Task SendEmailAsync(string to, string subject, string htmlMessage);
    }

