using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using CampusHostels.API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class PaymentServiceTests
{
    private static PaymentService CreateService(ApplicationDbContext context)
    {
        return new PaymentService(context, new StubPaystackService(), CreateConfig(), new StubTenancyRepository());
    }

    private static IConfiguration CreateConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["App:BaseUrl"] = "https://example.test"
            })
            .Build();
    }

    private ApplicationDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task InitializePaymentAsync_ValidTenancy_CreatesPaymentRecord()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = Guid.NewGuid(),
            ContractStartDate = DateTime.UtcNow.AddDays(-10),
            ContractDurationMonths = 1
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        var (reference, authUrl) = await service.InitializePaymentAsync(tenancy.Id, 500m);

        Assert.NotNull(reference);
        Assert.NotEmpty(reference);
        Assert.NotNull(authUrl);
        Assert.Contains("checkout.paystack.com", authUrl);

        var payment = await context.Payments.FirstOrDefaultAsync(p => p.Reference == reference);
        Assert.NotNull(payment);
        Assert.Equal(500m, payment.Amount);
        Assert.Equal(PaymentStatus.Pending, payment.Status);
    }

    [Fact]
    public async Task InitializePaymentAsync_InvalidTenancy_ThrowsException()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.InitializePaymentAsync(999, 500m));
    }

    [Fact]
    public async Task VerifyPaymentAsync_ValidReference_UpdatesPaymentStatus()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = Guid.NewGuid(),
            ContractStartDate = DateTime.UtcNow.AddDays(-10),
            ContractDurationMonths = 1
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        var (reference, _) = await service.InitializePaymentAsync(tenancy.Id, 500m);
        var verified = await service.VerifyPaymentAsync(reference);

        Assert.NotNull(verified);
        Assert.Equal(PaymentStatus.Success.ToString(), verified.Status);
        Assert.NotEqual(default, verified.CreatedAt);

        var summary = await context.PaymentSummaries
            .FirstOrDefaultAsync(s => s.TenancyAgreementId == tenancy.Id);
        Assert.NotNull(summary);
        Assert.Equal(500m, summary.TotalAmountPaid);
        Assert.NotNull(summary.LastPaymentDate);
    }

    [Fact]
    public async Task GetPaymentsByTenancyAsync_MultiplePayments_ReturnsAll()
    {
        var context = CreateInMemoryContext();
        var service = CreateService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = Guid.NewGuid(),
            ContractStartDate = DateTime.UtcNow.AddDays(-10),
            ContractDurationMonths = 1
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        await service.InitializePaymentAsync(tenancy.Id, 250m);
        await service.InitializePaymentAsync(tenancy.Id, 250m);

        var payments = await service.GetPaymentsByTenancyAsync(tenancy.Id);

        Assert.NotNull(payments);
        Assert.Equal(2, payments.Count());
    }
}

public sealed class StubPaystackService : IPaystackService
{
    public Task<(string AuthorizationUrl, string Reference)> InitializeTransactionAsync(decimal amount, string email, string callbackUrl, string reference, string currency = "GHS", object? metadata = null)
        => Task.FromResult(($"https://checkout.paystack.com/{reference}", reference));

    public Task<(bool IsValid, string? Channel, string? GatewayResponse)> VerifyTransactionAsync(string reference)
        => Task.FromResult((true, "card", "approved"));

    public Task<bool> ValidateWebhookSignatureAsync(string payload, string signatureHeader)
        => Task.FromResult(true);
}

public sealed class StubTenancyRepository : ITenancyRepository
{
    public Task<TenancyAgreement> AddAsync(TenancyAgreement tenancy) => Task.FromResult(tenancy);

    public Task<TenancyAgreement?> GetByIdAsync(int id) => Task.FromResult<TenancyAgreement?>(null);

    public Task<List<TenancyAgreement>> GetPaidTenancyAsync(Guid tenantId) => Task.FromResult(new List<TenancyAgreement>());

    public Task<List<TenancyAgreement>> GetActiveTenanciesByUnitAsync(int propertyId, int unitId) => Task.FromResult(new List<TenancyAgreement>());

    public Task SaveChangesAsync() => Task.CompletedTask;
}
