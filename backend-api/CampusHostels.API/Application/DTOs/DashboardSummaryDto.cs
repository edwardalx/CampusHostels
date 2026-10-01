namespace CampusHostels.API.Application.DTOs;

public class DashboardSummaryDto
{
    public int OccupiedRooms { get; set; }
    public int TotalRooms { get; set; }
    public int AvailableBeds { get; set; }
    public Dictionary<string, decimal> PropertyRevenueByCurrency { get; set; } = [];
    public int ActiveTenancyAgreements { get; set; }
    public int ActiveTenants { get; set; }
    public int ActiveTenanciesNotFullyPaid { get; set; }
    public int Year { get; set; }
}