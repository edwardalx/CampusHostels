namespace CampusHostels.API.Application.DTOs;

public class UnitDto
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public int Floor { get; set; }
    public string? RoomNumber { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Cost { get; set; }
    public int? MaxNoOfPeople { get; set; }
    public bool Availability { get; set; }
    public string UnitType { get; set; } = "Single";
}
