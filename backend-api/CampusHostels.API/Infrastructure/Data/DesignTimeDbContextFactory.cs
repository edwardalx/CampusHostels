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

        // Secrets live in the git-ignored .env file locally (and in real environment variables in Docker),
        // so read it here too; this factory runs before Program.cs does.
        DotNetEnv.Env.Load();

        // Use the environment variable to determine dev or prod
        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production";

        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var conn = config.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(conn))
        {
            // Never guess a provider: scaffolding against the wrong one produces a broken migration.
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not set. Put ConnectionStrings__DefaultConnection in the .env file " +
                "(see .env.example) or the environment before running dotnet ef.");
        }

        builder.UseNpgsql(conn);

        return new ApplicationDbContext(builder.Options);
    }
}
