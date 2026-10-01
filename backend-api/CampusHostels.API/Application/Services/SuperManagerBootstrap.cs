using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHostels.API.Application.Services;

/// <summary>
/// One-time recovery path for the Super Manager account that older databases were seeded with.
///
/// The "LockSeededSuperAdmin" migration replaces that account's publicly documented password with
/// a marker nobody can match. To get back in, set Bootstrap__SuperManagerPassword (12+ characters)
/// in the server's environment, start the API once, sign in, change the password, then remove the
/// setting. It only ever acts on the locked seeded account, so leaving it set later is harmless.
/// </summary>
public static class SuperManagerBootstrap
{
    public const string LockedPasswordMarker = "!locked";
    public static readonly Guid SeededManagerId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const int MinimumPasswordLength = 12;

    public static async Task RunAsync(IServiceProvider services, IConfiguration configuration)
    {
        var password = configuration["Bootstrap:SuperManagerPassword"];
        if (string.IsNullOrWhiteSpace(password)) return;

        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(SuperManagerBootstrap));

        if (password.Length < MinimumPasswordLength)
        {
            logger.LogWarning("Bootstrap__SuperManagerPassword ignored: it must be at least {Length} characters.", MinimumPasswordLength);
            return;
        }

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var manager = await db.Managers.FirstOrDefaultAsync(m =>
                m.ManagerId == SeededManagerId && m.PasswordHash == LockedPasswordMarker);

            if (manager is null)
            {
                logger.LogInformation("Bootstrap__SuperManagerPassword is set but there is no locked seeded account to recover; ignoring it.");
                return;
            }

            manager.PasswordHash = AccountService.HashPassword(password);
            manager.MustChangePassword = true;
            manager.FailedLoginAttempts = 0;
            manager.IsActive = true;
            manager.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            logger.LogWarning(
                "Recovered the seeded Super Manager '{Username}' with Bootstrap__SuperManagerPassword. Sign in and change the password now, then remove that setting.",
                manager.Username);
        }
        catch (Exception ex)
        {
            // Never stop the API from starting because of a recovery helper (e.g. database not migrated yet).
            logger.LogError(ex, "Super Manager bootstrap failed.");
        }
    }
}
