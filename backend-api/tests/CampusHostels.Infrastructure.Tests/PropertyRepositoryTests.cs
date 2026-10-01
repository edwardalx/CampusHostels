using System;
using System.Linq;
using System.Threading.Tasks;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CampusHostels.Infrastructure.Tests;

public class PropertyRepositoryTests
{
    [Fact]
    public async Task GetForManagerAsync_FiltersOwnerAndIncludesUnits()
    {
        var managerId = Guid.NewGuid();
        var otherManagerId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new ApplicationDbContext(options);
        var ownedProperty = new Property
        {
            Name = "Owned Residence",
            Location = "Accra",
            OwnerManagerId = managerId
        };
        var otherProperty = new Property
        {
            Name = "Other Residence",
            Location = "Kumasi",
            OwnerManagerId = otherManagerId
        };
        db.Properties.AddRange(ownedProperty, otherProperty);
        await db.SaveChangesAsync();
        db.Units.Add(new Unit
        {
            PropertyId = ownedProperty.Id,
            RoomNumber = "101",
            Cost = 900m
        });
        await db.SaveChangesAsync();

        var repository = new EfPropertyRepository(db);
        var managerProperties = (await repository.GetForManagerAsync(managerId)).ToList();
        var allProperties = (await repository.GetForManagerAsync(null)).ToList();

        var property = Assert.Single(managerProperties);
        Assert.Equal("Owned Residence", property.Name);
        Assert.Single(property.Units);
        Assert.Equal(2, allProperties.Count);
    }

    [Fact]
    public async Task AddAndGetProperty_Works()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "Test_AddAndGetProperty")
            .Options;

        await using var context = new ApplicationDbContext(options);
        var repo = new EfPropertyRepository(context);

        var prop = new CampusHostels.API.Domain.Entities.Property { Name = "TestProp", Location = "Nowhere" };
        await repo.AddAsync(prop);
        await repo.SaveChangesAsync();

        var list = await repo.GetAllAsync();
        Assert.Contains(list, p => p.Name == "TestProp");

        var fetched = await repo.GetByIdAsync(prop.Id);
        Assert.NotNull(fetched);
        Assert.Equal("TestProp", fetched!.Name);
    }
}
