namespace CampusHostels.API.Application.DTOs;

public class PropertyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal? StartingPrice { get; set; } = 120;  // Default starting price per month
    public string? ImageUrl { get; set; }
    public int? NoOfUnits { get; set; }
    public int? NoOfFloors { get; set; }
    public double AverageRating { get; set; }
    public bool Availability { get; set; }
}
