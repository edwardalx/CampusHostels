namespace CampusHostels.API.Domain.Entities;

public enum UnitType
{
    Single,
    Double,
    Shared
}

public class Unit
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public Property? Property { get; set; }
    public int Floor { get; set; }
    public string? RoomNumber { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Cost { get; set; }
    public int? MaxNoOfPeople { get; set; }
    public bool Availability { get; set; } = true;
    public UnitType UnitType { get; set; } = UnitType.Single;

    public ICollection<Image> Images { get; set; } = [];
}
