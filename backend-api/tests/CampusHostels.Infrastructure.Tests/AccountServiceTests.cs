using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class AccountServiceTests
{
    private static AccountService CreateService(ApplicationDbContext context)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new AccountService(context, new MockTokenService(), NullLogger<AccountService>.Instance, config);
    }

    private ApplicationDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task RegisterAsync_ValidData_CreatesUserAndReturnsToken()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var dto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "SecurePassword123!",
            Role = "tenant"
        };

        var response = await service.RegisterAsync(dto);

        Assert.NotNull(response);
        Assert.Equal("test@example.com", response.Email);
        Assert.Equal("tenant", response.Role);
        Assert.NotNull(response.Token);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateUsername_ThrowsException()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var existingUser = new User
        {
            PhoneNumber = "existing-phone",
            Email = "existing@example.com",
            PasswordHash = "hash",
            Role = "tenant"
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var dto = new RegisterDto
        {
            Email = "new@example.com",
            Password = "Password123!",
            Role = "tenant"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterAsync(dto));
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenResponse()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        await service.RegisterAsync(new RegisterDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            Role = "tenant"
        });

        var response = await service.LoginAsync(new LoginDto
        {
            Email = "test@example.com",
            Password = "Password123!"
        });

        Assert.NotNull(response);
        Assert.Equal("test@example.com", response.Email);
        Assert.NotNull(response.Token);
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsException()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        await service.RegisterAsync(new RegisterDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            Role = "tenant"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(new LoginDto
        {
            Email = "test@example.com",
            Password = "WrongPassword"
        }));
    }
}

public class MockTokenService : ITokenService
{
    public string CreateToken(User user, out DateTime expires)
    {
        expires = DateTime.UtcNow.AddHours(1);
        return $"mock-token-{user.Id}-{expires:O}";
    }
}
