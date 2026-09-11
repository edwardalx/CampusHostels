using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Interfaces;

public interface IManagerTokenService
{
    string CreateToken(Manager manager, out DateTime expires);
}
