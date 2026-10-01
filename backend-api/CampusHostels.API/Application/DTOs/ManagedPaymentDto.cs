namespace CampusHostels.API.Application.DTOs;

public class ManagedPaymentDto
{
    public int PaymentId { get; set; }
    public string Reference { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public Guid? OwnerManagerId { get; set; }
    public int UnitId { get; set; }
    public string? RoomNumber { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Channel { get; set; }

    /// <summary>When the payment succeeded, or when it was created if it has not.</summary>
    public DateTime Date { get; set; }
}

public class PaymentSummaryDto
{
    /// <summary>Successful payments received this calendar year, by currency.</summary>
    public Dictionary<string, decimal> CollectedThisYearByCurrency { get; set; } = [];
    public int Pending { get; set; }
    public int Failed { get; set; }
    public int Year { get; set; }
}

public class ManagedPaymentsResponseDto : PagedResponseDto
{
    public PaymentSummaryDto Summary { get; set; } = new();
    public List<ManagedPaymentDto> Items { get; set; } = [];
}
