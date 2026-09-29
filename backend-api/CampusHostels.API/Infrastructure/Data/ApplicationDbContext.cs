using CampusHostels.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Manager> Managers { get; set; }
    public DbSet<ManagerFunction> ManagerFunctions { get; set; }
    public DbSet<Property> Properties { get; set; }
    public DbSet<Unit> Units { get; set; }
    public DbSet<Image> Images { get; set; }
    public DbSet<TenancyAgreement> TenancyAgreements { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentSummary> PaymentSummaries { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<Rating> Ratings { get; set; }
    // public DbSet<Review> Reviews { get; set; }

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

        // Manager configuration
        modelBuilder.Entity<Manager>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ManagerId).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.Property(e => e.Tier).HasConversion<string>().HasDefaultValue(CampusHostels.API.Domain.Enums.ManagerTier.Standard);

            // Dev-only bootstrap Super Manager so the admin app can be logged into before the
            // Phase B "grant manager" workflow exists. Username: superadmin, Password: SuperManager123!
            // — rotate/remove this seed before any non-local deployment.
            entity.HasData(new Manager
            {
                Id = 1,
                ManagerId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                FirstName = "Super",
                LastName = "Manager",
                Username = "superadmin",
                Email = "superadmin@campushostels.dev",
                PhoneNumber = "+10000000000",
                PasswordHash = "hDgl6VBbn//EPILc2W7vuugsmjjjrXbroJhcpZe3dpY=",
                Tier = CampusHostels.API.Domain.Enums.ManagerTier.Super,
                IsActive = true,
                MustChangePassword = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
        });

        modelBuilder.Entity<ManagerFunction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Function)
                .HasConversion<string>()
                .IsRequired();
            entity.HasOne(e => e.Manager)
                .WithMany(e => e.Functions)
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.ManagerId, e.Function }).IsUnique();
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
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.TenantId).HasPrincipalKey(u => u.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Reference).IsUnique();
            entity.HasOne(e => e.Unit).WithMany().HasForeignKey(e => e.UnitId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Currency).HasConversion<string>().IsRequired();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Provider).HasConversion<string>();
            // tenancy relationship configured from TenancyAgreement side
        });

        // PaymentSummary configuration
        modelBuilder.Entity<PaymentSummary>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TenancyAgreement).WithOne().HasForeignKey<PaymentSummary>(e => e.TenancyAgreementId).OnDelete(DeleteBehavior.Cascade);
        });
        // PasswordResetToken configuration
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TokenHash).IsUnique(false);
            entity.Property(e => e.Used).HasDefaultValue(false);
            entity.ToTable("PasswordResetTokens");
        });
    }
}