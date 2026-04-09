using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace CampusHostels.API.Infrastructure.Repositories;
public class EfReviewRatingRepository : IReviewRatingRepository
{
    private readonly ApplicationDbContext _db;

    public EfReviewRatingRepository(ApplicationDbContext context)
    {
        _db = context;
    }

    // public async Task AddReviewAsync(Review review)
    // {
    //     await _db.Reviews.AddAsync(review);
    // }

    public async Task AddRatingAsync(Rating rating)
    {
        await _db.Ratings.AddAsync(rating);
    }

    // public async Task<IEnumerable<Review>> GetReviewsByPropertyIdAsync(int propertyId)
    // {
    //     return await _db.Reviews.Where(r => r.PropertyId == propertyId).ToListAsync();
    // }

    public async Task<IEnumerable<Rating>> GetRatingsByPropertyIdAsync(int propertyId)
    {
        return await _db.Ratings.Where(r => r.PropertyId == propertyId).ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
