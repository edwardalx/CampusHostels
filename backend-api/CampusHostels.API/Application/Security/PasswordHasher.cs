using System.Security.Cryptography;
using System.Text;

namespace CampusHostels.API.Application.Security;

/// <summary>
/// Password hashing for tenants and managers.
///
/// New hashes use PBKDF2-HMAC-SHA256 with a random per-password salt, stored as
/// "v2.{iterations}.{salt}.{hash}" (base64 parts). Accounts created before this existed hold an
/// unsalted SHA-256 hash; those still verify, and <c>needsRehash</c> tells the caller to replace
/// them with a v2 hash while the plain password is available (at the next successful sign-in).
/// </summary>
public static class PasswordHasher
{
    private const string Version = "v2";
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int MaxPasswordLength = 1024; // stops absurdly long inputs being used to burn CPU

    /// <summary>OWASP's current recommendation for PBKDF2-HMAC-SHA256.</summary>
    public const int CurrentIterations = 600_000;

    public static string Hash(string password) => Hash(password, CurrentIterations);

    internal static string Hash(string password, int iterations)
    {
        ArgumentNullException.ThrowIfNull(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var key = Derive(password, salt, iterations);
        return $"{Version}.{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public static bool Verify(string password, string? storedHash) => Verify(password, storedHash, out _);

    public static bool Verify(string password, string? storedHash, out bool needsRehash)
    {
        needsRehash = false;
        if (string.IsNullOrEmpty(storedHash) || password is null || password.Length > MaxPasswordLength)
        {
            return false;
        }

        // Marker values such as the locked Super Manager ("!locked") can never match a password.
        if (storedHash.StartsWith('!'))
        {
            return false;
        }

        if (storedHash.StartsWith(Version + ".", StringComparison.Ordinal))
        {
            return VerifyV2(password, storedHash, out needsRehash);
        }

        // Legacy: unsalted SHA-256, base64. Accepted so existing users can still sign in, then upgraded.
        var legacy = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));
        var matches = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(legacy),
            Encoding.UTF8.GetBytes(storedHash));
        needsRehash = matches;
        return matches;
    }

    private static bool VerifyV2(string password, string storedHash, out bool needsRehash)
    {
        needsRehash = false;

        var parts = storedHash.Split('.');
        if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations) || iterations < 1)
        {
            return false;
        }

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Derive(password, salt, iterations);
        var matches = CryptographicOperations.FixedTimeEquals(actual, expected);
        needsRehash = matches && iterations < CurrentIterations;
        return matches;
    }

    private static byte[] Derive(string password, byte[] salt, int iterations) =>
        Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, iterations, HashAlgorithmName.SHA256, KeySize);
}
