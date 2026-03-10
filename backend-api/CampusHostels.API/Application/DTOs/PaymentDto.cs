using CampusHostels.API.Domain.Enums;
namespace CampusHostels.API.Application.DTOs;
public class PaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? CreatedAt{get; set;}
    public string? Status { get; set; } 
    public string? Channel { get; set; }
    public string? Currency { get; set; }
}