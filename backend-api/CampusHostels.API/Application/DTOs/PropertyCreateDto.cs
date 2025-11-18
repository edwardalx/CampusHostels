namespace CampusHostels.API.Application.DTOs;

public class PropertyCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? NoOfUnits { get; set; }
    public int? NoOfFloors { get; set; }
}
