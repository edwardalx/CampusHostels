using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CampusHostels.API.Infrastructure.Repositories;

public class EfMessageRepository : IMessageRepository
{
    private readonly ApplicationDbContext _db;

    public EfMessageRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Message message)
    {
        await _db.Messages.AddAsync(message);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}