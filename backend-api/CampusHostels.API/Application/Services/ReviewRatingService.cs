using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Infrastructure.Repositories;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace CampusHostels.API.Application.Services;

public class ReviewRatingService : IReviewRating
{
    private readonly IReviewRatingRepository _repo;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ReviewRatingService> _logger;

    public ReviewRatingService(IReviewRatingRepository repo, ApplicationDbContext db, ILogger<ReviewRatingService> logger)
    {
        _repo = repo;
        _db = db;
        _logger = logger;
    }

    //   public async Task AddReviewAsync(ReviewCreateDto dto)
    // {
    //     var review = new Review
    //     {
    //         Comment = dto.Comment,
    //         PropertyId = dto.PropertyId,
    //         UserId = dto.UserId
    //     };

    //     await _repo.AddReviewAsync(review);
    // }

    public async Task AddRatingAsync(RateCreateDto dto, int propertyId, Guid tenantId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.TenantId == tenantId);

        if (user == null)
            throw new KeyNotFoundException("User not found");

        var rating = new Rating
        {
            Score = dto.Score,
            PropertyId = propertyId,
            UserId = user.Id,
            Comment = dto.Comment
        };
        await _repo.AddRatingAsync(rating);
        await _repo.SaveChangesAsync();
        // Update property's average rating
        var property = await _db.Properties.FirstOrDefaultAsync(p => p.Id == propertyId);

        var ratings = await _db.Ratings.Where(r => r.PropertyId == propertyId).ToListAsync();
        if (property != null)
        {
            property.UpdateAverageRating(ratings);

            _logger.LogInformation(
                "Calculated AverageRating for property {PropertyId}: {Average}",
                propertyId,
                property.AverageRating
            );

            await _db.SaveChangesAsync();
        }
    }

    // public async Task<IEnumerable<Review>> GetReviewsByPropertyIdAsync(int propertyId)
    // {
    //     return await _repo.GetReviewsByPropertyIdAsync(propertyId);
    // }

    public async Task<IEnumerable<Rating>> GetRatingsByPropertyIdAsync(int propertyId)
    {
        return await _repo.GetRatingsByPropertyIdAsync(propertyId);
    }

}