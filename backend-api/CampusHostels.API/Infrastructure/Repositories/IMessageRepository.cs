using CampusHostels.API.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public interface IMessageRepository
{
    Task AddAsync(Message message);
    Task SaveChangesAsync();
}
