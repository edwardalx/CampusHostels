using System;
using System.Collections.Generic;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using CampusHostels.API.API.Controllers;
using CampusHostels.API.API.Extensions;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CampusHostels.Infrastructure.Tests;

/// <summary>
/// Guards the authorisation rules added when the payment, tenancy and profile endpoints were
/// locked down, plus the Super Manager lock-down and must-change-password enforcement.
/// </summary>
public class SecurityTests
{
    private static ApplicationDbContext NewDb() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static ClaimsPrincipal Tenant(Guid tenantId, string email = "tenant@example.com") =>
        new(new ClaimsIdentity(new[]
        {
            new Claim("tenantId", tenantId.ToString()),
            new Claim(ClaimTypes.Email, email)
        }, "test"));

    private static ClaimsPrincipal Manager(bool mustChangePassword = false, string tier = "Standard")
    {
        var claims = new List<Claim>
        {
            new("scope", "manager"),
            new("managerId", Guid.NewGuid().ToString()),
            new("managerTier", tier)
        };
        if (mustChangePassword) claims.Add(new Claim("mustChangePassword", "true"));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
    }

    private static T WithUser<T>(T controller, ClaimsPrincipal user) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        return controller;
    }

    private static TenancyAgreement Tenancy(int id, Guid tenantId) => new()
    {
        Id = id,
        TenantId = tenantId,
        ContractStartDate = DateTime.UtcNow,
        ContractDurationMonths = 12
    };

    // ------------------------------------------------------------------ tenancies

    [Fact]
    public async Task Tenancies_Get_SomeoneElsesTenancy_LooksLikeItDoesNotExist()
    {
        var owner = Guid.NewGuid();
        await using var db = NewDb();
        db.TenancyAgreements.Add(Tenancy(1, owner));
        await db.SaveChangesAsync();

        var controller = WithUser(new TenanciesController(null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<NotFoundResult>(await controller.Get(1));
    }

    [Fact]
    public async Task Tenancies_Paid_ForAnotherTenantId_IsForbidden()
    {
        await using var db = NewDb();
        var controller = WithUser(new TenanciesController(null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<ForbidResult>(await controller.GetPaidTenancy(Guid.NewGuid()));
    }

    [Fact]
    public async Task Tenancies_Paid_WithManagerToken_IsUnauthorized()
    {
        await using var db = NewDb();
        var controller = WithUser(new TenanciesController(null!, db), Manager());

        Assert.IsType<UnauthorizedResult>(await controller.GetPaidTenancy(Guid.NewGuid()));
    }

    // ------------------------------------------------------------------ payments

    [Fact]
    public async Task Payments_History_ForAnotherTenantId_IsForbidden()
    {
        await using var db = NewDb();
        var controller = WithUser(new PaymentsController(null!, null!, null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<ForbidResult>(await controller.GetPaymentsByTenant(Guid.NewGuid()));
    }

    [Fact]
    public async Task Payments_ByTenancy_ForForeignTenancy_IsNotFound()
    {
        await using var db = NewDb();
        db.TenancyAgreements.Add(Tenancy(7, Guid.NewGuid()));
        await db.SaveChangesAsync();
        var controller = WithUser(new PaymentsController(null!, null!, null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<NotFoundResult>(await controller.GetPaymentsByTenancy(7));
    }

    [Fact]
    public async Task Payments_Initialize_ForForeignTenancy_IsForbidden()
    {
        await using var db = NewDb();
        db.TenancyAgreements.Add(Tenancy(3, Guid.NewGuid()));
        await db.SaveChangesAsync();
        var controller = WithUser(new PaymentsController(null!, null!, null!, db), Tenant(Guid.NewGuid()));

        var result = await controller.Initialize(new InitializePaymentRequest
        {
            TenancyId = 3,
            Amount = 100,
            Email = "a@b.com",
            Phone = "+233200000000"
        });

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Payments_Verify_ForSomeoneElsesPayment_IsForbidden()
    {
        await using var db = NewDb();
        db.Payments.Add(new Payment { Reference = "PAY-1", TenantId = Guid.NewGuid(), Email = "x@y.com", Amount = 10 });
        await db.SaveChangesAsync();
        var controller = WithUser(new PaymentsController(null!, null!, null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<ForbidResult>(await controller.Verify(new VerifyRequest { Reference = "PAY-1" }));
    }

    [Fact]
    public async Task Payments_Verify_UnknownReference_IsNotFound()
    {
        await using var db = NewDb();
        var controller = WithUser(new PaymentsController(null!, null!, null!, db), Tenant(Guid.NewGuid()));

        Assert.IsType<NotFoundObjectResult>(await controller.Verify(new VerifyRequest { Reference = "nope" }));
    }

    // ------------------------------------------------------------------ profile + liked hostels

    [Fact]
    public async Task Accounts_Update_AnotherUsersProfile_IsForbidden()
    {
        var controller = WithUser(
            new AccountsController(null!, null!, null!, null!, null!, new ConfigurationBuilder().Build()),
            Tenant(Guid.NewGuid(), "me@example.com"));

        var result = await controller.UpdateUser(new UpdateUserDto { Email = "victim@example.com", PhoneNumber = "+233200000001" });

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Accounts_LikedHostels_ForAnotherTenantId_IsForbidden()
    {
        var controller = WithUser(
            new AccountsController(null!, null!, null!, null!, null!, new ConfigurationBuilder().Build()),
            Tenant(Guid.NewGuid()));

        Assert.IsType<ForbidResult>(await controller.GetLikedHostels(Guid.NewGuid()));
        Assert.IsType<ForbidResult>(await controller.AddLikedHostel(Guid.NewGuid(), 1));
    }

    // ------------------------------------------------------------------ must-change-password enforcement

    private static async Task<bool> Allowed(string policy, ClaimsPrincipal user)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(AuthorizationPolicies.Configure);
        using var provider = services.BuildServiceProvider();
        var authorisation = provider.GetRequiredService<IAuthorizationService>();
        return (await authorisation.AuthorizeAsync(user, policy)).Succeeded;
    }

    [Fact]
    public async Task RequireManager_RefusesAManagerWhoMustChangePassword()
    {
        Assert.True(await Allowed(AuthorizationPolicies.RequireManager, Manager()));
        Assert.False(await Allowed(AuthorizationPolicies.RequireManager, Manager(mustChangePassword: true)));
    }

    [Fact]
    public async Task RequireManagerSession_StillAllowsChangingThePassword()
    {
        Assert.True(await Allowed(AuthorizationPolicies.RequireManagerSession, Manager(mustChangePassword: true)));
    }

    [Fact]
    public async Task RequireSuperManager_RefusesFlaggedAndNonSuperTokens()
    {
        Assert.True(await Allowed(AuthorizationPolicies.RequireSuperManager, Manager(tier: "Super")));
        Assert.False(await Allowed(AuthorizationPolicies.RequireSuperManager, Manager(mustChangePassword: true, tier: "Super")));
        Assert.False(await Allowed(AuthorizationPolicies.RequireSuperManager, Manager(tier: "Standard")));
    }

    [Fact]
    public async Task TenantTokens_NeverSatisfyManagerPolicies()
    {
        var tenant = Tenant(Guid.NewGuid());
        Assert.False(await Allowed(AuthorizationPolicies.RequireManager, tenant));
        Assert.False(await Allowed(AuthorizationPolicies.RequireManagerSession, tenant));
        Assert.False(await Allowed(AuthorizationPolicies.RequireSuperManager, tenant));
    }

    [Fact]
    public void ManagerToken_CarriesTheMustChangeClaimOnlyWhenFlagged()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = new string('k', 48)
            })
            .Build();
        var service = new ManagerTokenService(config);

        string[] ClaimsFor(bool mustChange)
        {
            var manager = new Manager { FirstName = "A", Email = "a@b.com", MustChangePassword = mustChange };
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(service.CreateToken(manager, out _));
            return jwt.Claims.Where(c => c.Type == "mustChangePassword").Select(c => c.Value).ToArray();
        }

        Assert.Equal(new[] { "true" }, ClaimsFor(true));
        Assert.Empty(ClaimsFor(false));
    }

    // ------------------------------------------------------------------ seeded Super Manager recovery

    private static (ServiceProvider Provider, IConfiguration Config) BootstrapHost(string? password, string dbName)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Bootstrap:SuperManagerPassword"] = password })
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase(dbName));
        return (services.BuildServiceProvider(), config);
    }

    private static async Task SeedManager(ServiceProvider provider, string passwordHash)
    {
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Managers.Add(new Manager
        {
            ManagerId = SuperManagerBootstrap.SeededManagerId,
            FirstName = "Super",
            LastName = "Manager",
            Username = "superadmin",
            Email = "superadmin@campushostels.dev",
            PhoneNumber = "+10000000000",
            PasswordHash = passwordHash,
            Tier = ManagerTier.Super,
            IsActive = true
        });
        await db.SaveChangesAsync();
    }

    private static async Task<Manager> Reload(ServiceProvider provider)
    {
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Managers.AsNoTracking().SingleAsync();
    }

    [Fact]
    public async Task Bootstrap_UnlocksTheLockedSeededAccount_AndForcesAChange()
    {
        var (provider, config) = BootstrapHost("a-long-enough-password", Guid.NewGuid().ToString());
        await SeedManager(provider, SuperManagerBootstrap.LockedPasswordMarker);

        await SuperManagerBootstrap.RunAsync(provider, config);

        var manager = await Reload(provider);
        Assert.True(AccountService.VerifyPassword("a-long-enough-password", manager.PasswordHash));
        Assert.True(manager.MustChangePassword);
    }

    [Fact]
    public async Task Bootstrap_IgnoresPasswordsShorterThanTwelveCharacters()
    {
        var (provider, config) = BootstrapHost("too-short", Guid.NewGuid().ToString());
        await SeedManager(provider, SuperManagerBootstrap.LockedPasswordMarker);

        await SuperManagerBootstrap.RunAsync(provider, config);

        Assert.Equal(SuperManagerBootstrap.LockedPasswordMarker, (await Reload(provider)).PasswordHash);
    }

    [Fact]
    public async Task Bootstrap_NeverTouchesAnAccountThatAlreadyHasARealPassword()
    {
        var (provider, config) = BootstrapHost("a-long-enough-password", Guid.NewGuid().ToString());
        var realHash = AccountService.HashPassword("the-admins-own-password");
        await SeedManager(provider, realHash);

        await SuperManagerBootstrap.RunAsync(provider, config);

        Assert.Equal(realHash, (await Reload(provider)).PasswordHash);
    }

    [Fact]
    public async Task Bootstrap_DoesNothingWhenNoPasswordIsConfigured()
    {
        var (provider, config) = BootstrapHost(null, Guid.NewGuid().ToString());
        await SeedManager(provider, SuperManagerBootstrap.LockedPasswordMarker);

        await SuperManagerBootstrap.RunAsync(provider, config);

        Assert.Equal(SuperManagerBootstrap.LockedPasswordMarker, (await Reload(provider)).PasswordHash);
    }

    [Fact]
    public void LockedMarker_CanNeverMatchAnyPassword()
    {
        Assert.False(AccountService.VerifyPassword("", SuperManagerBootstrap.LockedPasswordMarker));
        Assert.False(AccountService.VerifyPassword(SuperManagerBootstrap.LockedPasswordMarker, SuperManagerBootstrap.LockedPasswordMarker));
    }
}
