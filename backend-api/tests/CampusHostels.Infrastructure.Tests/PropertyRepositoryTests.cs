using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.Infrastructure.Tests;

public class PropertyRepositoryTests
{
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
