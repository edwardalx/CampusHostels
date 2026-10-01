namespace CampusHostels.API.Application.DTOs;

public class OccupancyTrendPointDto
{
    public int Year { get; set; }
    public DateTime AsOfDate { get; set; }
    public int BookedBeds { get; set; }
    public int TotalBeds { get; set; }
    public decimal OccupancyPercentage { get; set; }
}