using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]

public class RatingReviewController : ControllerBase
{
    private readonly IReviewRating _service;

    public RatingReviewController(IReviewRating service)
    {
        _service = service;
    }
    [Authorize]
    [HttpPost("add-rating/{propertyId}")]
    public async Task<IActionResult> AddRating([FromBody] RateCreateDto dto, int propertyId)
    {
        var tenantIdClaim = User.FindFirst("tenantId")?.Value;

        if (tenantIdClaim is null)
            return Unauthorized();

        var tenantId = Guid.Parse(tenantIdClaim);
        try
        {
            await _service.AddRatingAsync(dto, propertyId, tenantId);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        return Ok(new { message = "Rating added successfully." });
    }

    [HttpGet("ratings/{propertyId}")]
    public async Task<IActionResult> GetRatingsByPropertyId(int propertyId)
    {
        var ratings = await _service.GetRatingsByPropertyIdAsync(propertyId);
        return Ok(ratings);
    }
}
