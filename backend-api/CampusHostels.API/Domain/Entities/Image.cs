namespace CampusHostels.API.Domain.Entities;

public class Image
{
    public int Id { get; set; }
    public int? PropertyId { get; set; }
    public Property? Property { get; set; }
    public int? UnitId { get; set; }
    public Unit? Unit { get; set; }
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
}
