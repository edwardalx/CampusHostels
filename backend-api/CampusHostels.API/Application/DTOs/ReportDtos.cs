namespace CampusHostels.API.Application.DTOs;

public static class BookingStatus
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string CheckedIn = "Checked in";
    public const string Ended = "Ended";
}

public class RecentBookingDto
{
    public int TenancyId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string PropertyName { get; set; } = string.Empty;
    public string? RoomNumber { get; set; }
    public DateTime ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }

    /// <summary>Pending (unpaid or inactive), Confirmed (starts in future), Checked in or Ended.</summary>
    public string Status { get; set; } = BookingStatus.Pending;
}

public class RecentBookingsResponseDto : PagedResponseDto
{
    public List<RecentBookingDto> Items { get; set; } = [];
}

public class AlertCountsDto
{
    public int NewActivity { get; set; }
    public int OpenMaintenance { get; set; }
}

public class ActivityPageDto : PagedResponseDto
{
    public List<ActivityItemDto> Items { get; set; } = [];
}

public class ActivityItemDto
{
    /// <summary>"Booking", "Payment" or "Maintenance".</summary>
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
}
