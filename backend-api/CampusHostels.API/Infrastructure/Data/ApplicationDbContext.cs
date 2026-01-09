using CampusHostels.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Property> Properties { get; set; }
    public DbSet<Unit> Units { get; set; }
    public DbSet<Image> Images { get; set; }
    public DbSet<TenancyAgreement> TenancyAgreements { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentSummary> PaymentSummaries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.Property(e => e.Role).HasDefaultValue("Tenant");
        });

        // Property configuration
        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Availability).HasDefaultValue(true);
        });

        // Unit configuration
        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Property).WithMany(p => p.Units).HasForeignKey(e => e.PropertyId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.PropertyId, e.RoomNumber }).IsUnique();
            entity.Property(e => e.Availability).HasDefaultValue(true);
        });

        // Image configuration
        modelBuilder.Entity<Image>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Property).WithMany(p => p.Images).HasForeignKey(e => e.PropertyId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Unit).WithMany(u => u.Images).HasForeignKey(e => e.UnitId).OnDelete(DeleteBehavior.Cascade);
        });

        // TenancyAgreement configuration
        modelBuilder.Entity<TenancyAgreement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Property).WithMany().HasForeignKey(e => e.PropertyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unit).WithMany().HasForeignKey(e => e.UnitId).OnDelete(DeleteBehavior.Restrict);
            // map one-to-many with payments
            entity.HasMany(e => e.Payments).WithOne(p => p.TenancyAgreement).HasForeignKey(p => p.TenancyAgreementId).OnDelete(DeleteBehavior.SetNull);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Reference).IsUnique();
            entity.HasOne(e => e.Unit).WithMany().HasForeignKey(e => e.UnitId).OnDelete(DeleteBehavior.Cascade);
            // tenancy relationship configured from TenancyAgreement side
        });

        // PaymentSummary configuration
        modelBuilder.Entity<PaymentSummary>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TenancyAgreement).WithOne().HasForeignKey<PaymentSummary>(e => e.TenancyAgreementId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}