using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Infrastructure.Repositories
{
    public class PlaceholderRepository
    {
        public Tenant GetSample() => new Tenant { Id = System.Guid.NewGuid(), UserName = "repo-sample" };
    }
}
