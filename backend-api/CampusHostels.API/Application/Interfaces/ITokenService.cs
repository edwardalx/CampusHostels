using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Interfaces;

public interface ITokenService
{
    string CreateToken(User user, out DateTime expires);
}
