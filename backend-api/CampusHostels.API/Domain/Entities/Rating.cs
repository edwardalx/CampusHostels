using System.ComponentModel.DataAnnotations;
namespace CampusHostels.API.Domain.Entities;

public class Rating
{
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required]
    public int PropertyId { get; set; }
    public double Score { get; set; }
    public string Comment { get; set; } = string.Empty;
}

// public class Review
// {
//     public int Id { get; set; }
//     public int PropertyId { get; set; }
//     public int UserId { get; set; }
//     public string Comment { get; set; } = string.Empty;
// }