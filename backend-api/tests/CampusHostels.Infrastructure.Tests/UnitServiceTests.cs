using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Mapping;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class UnitServiceTests
{
    private ApplicationDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        return config.CreateMapper();
    }

    [Fact]
    public async Task GetByPropertyAsync_ReturnsUnitsForProperty()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var repo = new EfUnitRepository(context);
        var service = new UnitService(repo, mapper);

    var property = new Property { Name = "Test Property", Location = "123 Main" };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

    var unit1 = new Unit { PropertyId = property.Id, RoomNumber = "101", Cost = 500m };
    var unit2 = new Unit { PropertyId = property.Id, RoomNumber = "102", Cost = 500m };
        context.Units.AddRange(unit1, unit2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByPropertyAsync(property.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetByPropertyAsync_ReturnsPersistedBedsLeft()
    {
        await using var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var service = new UnitService(new EfUnitRepository(context), mapper);
        var property = new Property { Name = "Test Property", Location = "123 Main" };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var unit = new Unit
        {
            PropertyId = property.Id,
            RoomNumber = "101",
            MaxNoOfPeople = 2,
            BedsLeft = 2
        };
        context.Units.Add(unit);
        await context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        context.TenancyAgreements.AddRange(
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unit.Id,
                TenantId = Guid.NewGuid(),
                ContractStartDate = now.AddDays(-10),
                ContractDurationMonths = 6,
                ContractEndDate = now.AddMonths(2),
                IsActive = true,
                TotalAmountPaid = 100m
            },
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unit.Id,
                TenantId = Guid.NewGuid(),
                ContractStartDate = now.AddDays(-10),
                ContractDurationMonths = 6,
                ContractEndDate = now.AddMonths(2),
                IsActive = false,
                TotalAmountPaid = 100m
            },
            new TenancyAgreement
            {
                PropertyId = property.Id,
                UnitId = unit.Id,
                TenantId = Guid.NewGuid(),
                ContractStartDate = now.AddMonths(-3),
                ContractDurationMonths = 1,
                ContractEndDate = now.AddMonths(-2),
                IsActive = true,
                TotalAmountPaid = 100m
            }
        );
        await context.SaveChangesAsync();

        var result = await service.GetByPropertyAsync(property.Id);

        var unitDto = Assert.Single(result);
        Assert.Equal(2, unitDto.BedsLeft);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesUnit()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var repo = new EfUnitRepository(context);
        var service = new UnitService(repo, mapper);

        var property = new Property { Name = "Test Property", Location = "123 Main" };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var dto = new UnitCreateDto
        {
            RoomNumber = "201",
            Cost = 600m,
            Floor = 2,
            MaxNoOfPeople = 2
        };

        // Act
        var result = await service.CreateAsync(property.Id, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("201", result.RoomNumber);
    Assert.Equal(600m, result.Cost);
    }
}
