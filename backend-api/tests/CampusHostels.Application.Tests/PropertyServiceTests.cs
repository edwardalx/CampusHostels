using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Mapping;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class PropertyServiceTests
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
    public async Task GetAllAsync_ReturnsAllProperties()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var repo = new EfPropertyRepository(context);
        var service = new PropertyService(repo, mapper);

        var prop1 = new Property { Name = "Property 1", Address = "123 Main St", Owner = "Owner 1" };
        var prop2 = new Property { Name = "Property 2", Address = "456 Oak Ave", Owner = "Owner 2" };
        context.Properties.AddRange(prop1, prop2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsProperty()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mapper = CreateMapper();
        var repo = new EfPropertyRepository(context);
        var service = new PropertyService(repo, mapper);

        var dto = new PropertyCreateDto
        {
            Name = "New Property",
            Address = "789 Elm St",
            Owner = "New Owner"
        };

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Property", result.Name);
        Assert.Equal("789 Elm St", result.Address);
    }
}
