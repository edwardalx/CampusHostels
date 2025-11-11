using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace CampusHostels.Api.IntegrationTests;

public class PropertiesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PropertiesApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProperties_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/properties");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
