namespace CampusHostels.API.Application.DTOs;

public class DashboardSummaryDto
{
    public int OccupiedRooms { get; set; }
    public int TotalRooms { get; set; }
    public int AvailableBeds { get; set; }
    public Dictionary<string, decimal> PropertyRevenueByCurrency { get; set; } = [];
    public int ActiveTenancyAgreements { get; set; }
    public int ActiveTenants { get; set; }
    public int ActiveTenanciesNotFullyPaid { get; set; }
    /// <summary>Mean rating score across all ratings for the properties in scope; null when unrated.</summary>
    public double? AverageRating { get; set; }
    public int RatingCount { get; set; }
    /// <summary>AverageRating as a percentage of the maximum score (5); null when unrated.</summary>
    public double? RatingPercentage { get; set; }
    public int Year { get; set; }
}