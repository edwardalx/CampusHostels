
namespace CampusHostels.API.Application.DTOs;
public class TenancyDetailsDto
{
    public int Id { get; set; }
    public decimal TotalAmountPaid { get; set; }
    public List<PaymentDto> Payments { get; set; } = new();
    public UnitDto? Unit { get; set; }
    public PropertyDto? Property { get; set; }
}
