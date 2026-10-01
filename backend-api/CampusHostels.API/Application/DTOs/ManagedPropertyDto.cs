namespace CampusHostels.API.Application.DTOs;

public class ManagedPropertiesResponseDto : PagedResponseDto
{
    public List<ManagedPropertyDto> Items { get; set; } = [];
}

public class ManagedPropertyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal? StartingPrice { get; set; }
    public Guid? OwnerManagerId { get; set; }
    public string? ImageUrl { get; set; }
    public int NoOfUnits { get; set; }
    public int? NoOfFloors { get; set; }
    public double AverageRating { get; set; }
    public bool Availability { get; set; }
    public int OccupiedRooms { get; set; }
    public decimal OccupancyPercentage { get; set; }
    public Dictionary<string, decimal> RevenueByCurrency { get; set; } = [];
}