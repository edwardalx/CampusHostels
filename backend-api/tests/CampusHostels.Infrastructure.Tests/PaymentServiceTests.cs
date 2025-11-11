using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace CampusHostels.API.Application.Tests;

public class PaymentServiceTests
{
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
        // Arrange
        var context = CreateInMemoryContext();
        var service = new PaymentService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = 1,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            MonthlyRent = 500m
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        // Act
        var (reference, authUrl) = await service.InitializePaymentAsync(tenancy.Id, 500m);

        // Assert
        Assert.NotNull(reference);
        Assert.NotEmpty(reference);
        Assert.NotNull(authUrl);
        Assert.Contains("checkout.paystack.com", authUrl);

        var payment = await context.Payments.FirstOrDefaultAsync(p => p.Reference == reference);
        Assert.NotNull(payment);
        Assert.Equal(500m, payment.Amount);
        Assert.Equal("pending", payment.Status);
    }

    [Fact]
    public async Task InitializePaymentAsync_InvalidTenancy_ThrowsException()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = new PaymentService(context);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            service.InitializePaymentAsync(999, 500m));
    }

    [Fact]
    public async Task VerifyPaymentAsync_ValidReference_UpdatesPaymentStatus()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = new PaymentService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = 1,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            MonthlyRent = 500m
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        var (reference, _) = await service.InitializePaymentAsync(tenancy.Id, 500m);

        // Act
        var verified = await service.VerifyPaymentAsync(reference);

        // Assert
        Assert.NotNull(verified);
        Assert.Equal("success", verified.Status);
        Assert.NotNull(verified.PaidAt);

        // Check PaymentSummary was created/updated
        var summary = await context.PaymentSummaries
            .FirstOrDefaultAsync(s => s.TenancyAgreementId == tenancy.Id);
        Assert.NotNull(summary);
        Assert.Equal(500m, summary.TotalPaid);
        Assert.Equal(1, summary.PaymentCount);
    }

    [Fact]
    public async Task GetPaymentsByTenancyAsync_MultiplePayments_ReturnsAll()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var service = new PaymentService(context);

        var tenancy = new TenancyAgreement
        {
            UnitId = 1,
            TenantId = 1,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            MonthlyRent = 500m
        };
        context.TenancyAgreements.Add(tenancy);
        await context.SaveChangesAsync();

        // Create multiple payments
        await service.InitializePaymentAsync(tenancy.Id, 250m);
        await service.InitializePaymentAsync(tenancy.Id, 250m);

        // Act
        var payments = await service.GetPaymentsByTenancyAsync(tenancy.Id);

        // Assert
        Assert.NotNull(payments);
        Assert.Equal(2, payments.Count());
    }
}
