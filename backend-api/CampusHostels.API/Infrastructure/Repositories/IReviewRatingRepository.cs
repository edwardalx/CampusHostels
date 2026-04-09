using CampusHostels.API.Domain.Entities;
namespace CampusHostels.API.Infrastructure.Repositories;
public interface IReviewRatingRepository
{
    // Task AddReviewAsync(Review review);
    Task AddRatingAsync(Rating rating);
    // Task<IEnumerable<Review>> GetReviewsByPropertyIdAsync(int propertyId);
    Task<IEnumerable<Rating>> GetRatingsByPropertyIdAsync(int propertyId);
    Task SaveChangesAsync();
}
