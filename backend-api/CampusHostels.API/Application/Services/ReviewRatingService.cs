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

    public ReviewRatingService(IReviewRatingRepository repo, ApplicationDbContext db)
    {
        _repo = repo;
        _db = db;
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