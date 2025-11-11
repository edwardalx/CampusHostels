using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class AccountServiceTests
{
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
        // Arrange
        var context = CreateInMemoryContext();
        var tokenService = new MockTokenService();
        var service = new AccountService(context, tokenService);

        var dto = new RegisterDto
        {
            Username = "testuser",
            Email = "test@example.com",
            Password = "SecurePassword123!",
            Role = "tenant"
        };

        // Act
        var response = await service.RegisterAsync(dto);

        // Assert
        Assert.NotNull(response);
        Assert.Equal("testuser", response.Username);
        Assert.Equal("test@example.com", response.Email);
        Assert.Equal("tenant", response.Role);
        Assert.NotNull(response.Token);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateUsername_ThrowsException()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var tokenService = new MockTokenService();
        var service = new AccountService(context, tokenService);

        // Pre-create a user
        var existingUser = new User
        {
            Username = "testuser",
            Email = "existing@example.com",
            PasswordHash = "hash",
            Role = "tenant"
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var dto = new RegisterDto
        {
            Username = "testuser",
            Email = "new@example.com",
            Password = "Password123!",
            Role = "tenant"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterAsync(dto));
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenResponse()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var tokenService = new MockTokenService();
        var service = new AccountService(context, tokenService);

        // Create a user (hashed password: SHA256 of "Password123!")
        var user = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "z34pBJZv4MNeFFM6t2jqR73qp+6mV3F1cL8VL2aKwLw=", // Hash of "Password123!"
            Role = "tenant"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var dto = new LoginDto
        {
            Username = "testuser",
            Password = "Password123!"
        };

        // Act
        var response = await service.LoginAsync(dto);

        // Assert
        Assert.NotNull(response);
        Assert.Equal("testuser", response.Username);
        Assert.NotNull(response.Token);
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ThrowsException()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var tokenService = new MockTokenService();
        var service = new AccountService(context, tokenService);

        var user = new User
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "z34pBJZv4MNeFFM6t2jqR73qp+6mV3F1cL8VL2aKwLw=",
            Role = "tenant"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var dto = new LoginDto
        {
            Username = "testuser",
            Password = "WrongPassword"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(dto));
    }
}

/// <summary>Mock ITokenService for testing.</summary>
public class MockTokenService : ITokenService
{
    public string CreateToken(User user, out DateTime expires)
    {
        expires = DateTime.UtcNow.AddHours(1);
        return $"mock-token-{user.Id}-{expires:O}";
    }
}
