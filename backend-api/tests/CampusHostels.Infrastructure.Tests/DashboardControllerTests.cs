using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using CampusHostels.API.API.Controllers;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CampusHostels.Infrastructure.Tests;

public class DashboardControllerTests
{
    [Fact]
    public async Task GetSummary_CountsActiveTenancyAgreements_NotDistinctTenantIds()
    {
        var managerId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new ApplicationDbContext(options);
        var property = new Property
        {
            Name = "Alpha Residence",
            Location = "Accra",
            OwnerManagerId = managerId
        };
        var secondProperty = new Property
        {
            Name = "Beta Residence",
            Location = "Accra",
            OwnerManagerId = managerId
        };
        var otherManagerProperty = new Property
        {
            Name = "Other Residence",
            Location = "Kumasi",
            OwnerManagerId = Guid.NewGuid()
        };

        db.Properties.AddRange(property, secondProperty, otherManagerProperty);
        await db.SaveChangesAsync();

        var unitOne = new Unit
        {
            PropertyId = property.Id,
            Floor = 1,
            RoomNumber = "101",
            Availability = true,
            Cost = 2000m,
            MaxNoOfPeople = 2,
            BedsLeft = 1
        };

        var unitTwo = new Unit
        {
            PropertyId = property.Id,
            Floor = 1,
            RoomNumber = "102",
            Availability = true,
            Cost = 2100m,
            MaxNoOfPeople = 2,
            BedsLeft = 1
        };
        var secondPropertyUnit = new Unit
        {
            PropertyId = secondProperty.Id,
            Floor = 1,
            RoomNumber = "201",
            Availability = true,
            Cost = 1800m,
            MaxNoOfPeople = 4,
            BedsLeft = 4
        };

        db.Units.AddRange(unitOne, unitTwo, secondPropertyUnit);
        await db.SaveChangesAsync();

        db.TenancyAgreements.AddRange(
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unitOne.Id,
                TenantId = tenantId,
                ContractStartDate = DateTime.UtcNow.AddDays(-10),
                ContractDurationMonths = 6,
                ContractEndDate = DateTime.UtcNow.AddMonths(2),
                IsActive = true,
                TotalAmountPaid = 2000m
            },
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unitTwo.Id,
                TenantId = tenantId,
                ContractStartDate = DateTime.UtcNow.AddDays(-5),
                ContractDurationMonths = 6,
                ContractEndDate = DateTime.UtcNow.AddMonths(3),
                IsActive = true,
                TotalAmountPaid = 1500m
            },
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unitTwo.Id,
                TenantId = Guid.NewGuid(),
                ContractStartDate = DateTime.UtcNow.AddDays(-40),
                ContractDurationMonths = 2,
                ContractEndDate = DateTime.UtcNow.AddDays(-5),
                IsActive = false,
                TotalAmountPaid = 1000m
            }
        );
        db.TenancyAgreements.Add(new TenancyAgreement
        {
            PropertyId = secondProperty.Id,
            UnitId = secondPropertyUnit.Id,
            TenantId = Guid.NewGuid(),
            ContractStartDate = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            ContractDurationMonths = 12,
            ContractEndDate = new DateTime(2027, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true,
            TotalAmountPaid = 1800m
        });

        await db.SaveChangesAsync();

        var controller = new DashboardController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim("managerId", managerId.ToString()), new Claim("managerTier", "Standard")],
                        "TestAuth"))
                }
            }
        };

        var result = await controller.GetSummary(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = okResult.Value!;
        var summary = Assert.IsType<DashboardSummaryDto>(payload);

        Assert.Equal(3, summary.TotalRooms);
        Assert.Equal(6, summary.AvailableBeds);
        Assert.Equal(3, summary.ActiveTenancyAgreements);
        Assert.Equal(1, summary.ActiveTenanciesNotFullyPaid);

        var filteredResult = await controller.GetSummary(CancellationToken.None, [secondProperty.Id]);
        var filteredOkResult = Assert.IsType<OkObjectResult>(filteredResult.Result);
        var filteredSummary = Assert.IsType<DashboardSummaryDto>(filteredOkResult.Value);
        Assert.Equal(1, filteredSummary.TotalRooms);
        Assert.Equal(4, filteredSummary.AvailableBeds);
        Assert.Equal(1, filteredSummary.OccupiedRooms);
        Assert.Equal(1, filteredSummary.ActiveTenancyAgreements);

        var forbiddenResult = await controller.GetSummary(CancellationToken.None, [otherManagerProperty.Id]);
        Assert.IsType<ForbidResult>(forbiddenResult.Result);

        var trendResult = await controller.GetOccupancyTrend([secondProperty.Id], CancellationToken.None);
        var trendOkResult = Assert.IsType<OkObjectResult>(trendResult);
        var trend = Assert.IsAssignableFrom<System.Collections.Generic.IReadOnlyList<OccupancyTrendPointDto>>(
            trendOkResult.Value);
        Assert.Equal(2025, trend[0].Year);
        Assert.Equal(new DateTime(2025, 12, 31, 23, 59, 59, DateTimeKind.Utc).AddTicks(9999999), trend[0].AsOfDate);
        Assert.Equal(DateTime.UtcNow.Year, trend[^1].Year);
        Assert.Equal(1, trend[^1].BookedBeds);
        Assert.Equal(4, trend[^1].TotalBeds);
        Assert.Equal(25m, trend[^1].OccupancyPercentage);

        var forbiddenTrend = await controller.GetOccupancyTrend([otherManagerProperty.Id], CancellationToken.None);
        Assert.IsType<ForbidResult>(forbiddenTrend);
    }
}
