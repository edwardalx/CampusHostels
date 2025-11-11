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

        var property = new Property { Name = "Test Property", Address = "123 Main", Owner = "Owner" };
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
    public async Task CreateAsync_ValidDto_CreatesUnit()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var repo = new EfUnitRepository(context);
        var service = new UnitService(repo, mapper);

        var property = new Property { Name = "Test Property", Address = "123 Main", Owner = "Owner" };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var dto = new UnitCreateDto
        {
            RoomNumber = "201",
            Cost = 600m,
            Description = "Spacious room"
        };

        // Act
        var result = await service.CreateAsync(property.Id, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("201", result.RoomNumber);
        Assert.Equal(600m, result.Cost);
    }
}
