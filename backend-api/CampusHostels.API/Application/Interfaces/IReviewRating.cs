using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Application.DTOs;

namespace CampusHostels.API.Application.Interfaces;

public interface IReviewRating
{
    // Task AddReviewAsync(ReviewCreateDto review);
    Task AddRatingAsync(RateCreateDto rating, int propertyId, Guid tenantId);
    // Task<IEnumerable<Review>> GetReviewsByPropertyIdAsync(int propertyId);
    Task<IEnumerable<Rating>> GetRatingsByPropertyIdAsync(int propertyId);
}
