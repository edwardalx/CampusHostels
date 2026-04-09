namespace CampusHostels.API.Application.DTOs;

using System.ComponentModel.DataAnnotations;
// public class ReviewCreateDto
// {
//     [Required]
//     public int PropertyId { get; set; }
//     [Required]
//     public int UserId { get; set; }
//     public string Comment { get; set; } = string.Empty;
// }
public class RateCreateDto
{
    // public int UserId { get; set; }
   
    public double Score { get; set; }
    public string Comment { get; set; } = string.Empty;
}