using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace CampusHostels.API.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Use the environment variable to determine dev or prod
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production";

        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var conn = config.GetConnectionString("DefaultConnection");

        // Prefer PostgreSQL for both development and production in this repo
        // (development previously used Sqlite; switch to Npgsql to match runtime).
        if (!string.IsNullOrEmpty(conn) && (conn.StartsWith("Host=") || conn.StartsWith("postgres://") || conn.Contains("neon")))
        {
            builder.UseNpgsql(conn);
        }
        else
        {
            // Fallback to Sqlite only if a non-postgres connection string is present
            builder.UseSqlite(conn);
        }

        return new ApplicationDbContext(builder.Options);
    }
}
