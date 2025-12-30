using System.Collections.Generic;

namespace CampusHostels.API.Domain.Entities;

public class Property
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? NoOfUnits { get; set; }
    public int? NoOfFloors { get; set; }
    public decimal? StartingPrice { get; set; } = 120;  // Default starting price per month
    public bool Availability { get; set; } = true;

    public ICollection<Unit> Units { get; set; } = new List<Unit>();
    public ICollection<Image> Images { get; set; } = new List<Image>();
}
