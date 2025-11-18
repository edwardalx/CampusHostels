using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Infrastructure.Repositories
{
    public class PlaceholderRepository
    {
        public User GetSample() => new User { Username = "repo-sample" };
    }
}
