using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Application.Security;
using CampusHostels.API.Application.Services;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Domain.Enums;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusHostels.Infrastructure.Tests;

/// <summary>Password hashing (V-08) and password-reset hardening (V-06, V-07).</summary>
public class PasswordSecurityTests
{
    // ------------------------------------------------------------------ hashing

    private static string LegacySha256(string password) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(password)));

    [Fact]
    public void Hash_IsSaltedAndVerifies()
    {
        var first = PasswordHasher.Hash("correct horse battery");
        var second = PasswordHasher.Hash("correct horse battery");

        Assert.StartsWith("v2.", first);
        Assert.NotEqual(first, second); // different salts
        Assert.True(PasswordHasher.Verify("correct horse battery", first, out var needsRehash));
        Assert.False(needsRehash);
        Assert.True(PasswordHasher.Verify("correct horse battery", second));
        Assert.False(PasswordHasher.Verify("wrong password", first));
    }

    [Fact]
    public void LegacySha256Hashes_StillVerify_AndAskToBeUpgraded()
    {
        var legacy = LegacySha256("OldPassw0rd!");

        Assert.True(PasswordHasher.Verify("OldPassw0rd!", legacy, out var needsRehash));
        Assert.True(needsRehash);
        Assert.False(PasswordHasher.Verify("not it", legacy, out var wrongNeedsRehash));
        Assert.False(wrongNeedsRehash);
    }

    [Fact]
    public void WeakerIterationCounts_VerifyButAskToBeUpgraded()
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var key = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes("pw-for-old-cost"), salt, 1000, HashAlgorithmName.SHA256, 32);
        var stored = $"v2.1000.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";

        Assert.True(PasswordHasher.Verify("pw-for-old-cost", stored, out var needsRehash));
        Assert.True(needsRehash);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("!locked")]
    [InlineData("v2.notanumber.AAAA.AAAA")]
    [InlineData("v2.1000.%%%.%%%")]
    [InlineData("v2.1000.onlythree")]
    public void MalformedOrMarkerHashes_NeverVerify(string? stored)
    {
        Assert.False(PasswordHasher.Verify("anything", stored));
        Assert.False(PasswordHasher.Verify("", stored));
    }

    [Fact]
    public void ExcessivelyLongPasswords_AreRejectedWithoutHashing()
    {
        var stored = PasswordHasher.Hash("short");
        Assert.False(PasswordHasher.Verify(new string('a', 5000), stored));
    }

    private sealed class FakeTokenService : ITokenService
    {
        public string CreateToken(User user, out DateTime expires)
        {
            expires = DateTime.UtcNow.AddHours(1);
            return "token";
        }
    }

    private static ApplicationDbContext NewDb() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static User NewUser(string passwordHash) => new()
    {
        FirstName = "Ama",
        LastName = "Mensah",
        Email = "ama@example.com",
        PhoneNumber = "+233201234567",
        PasswordHash = passwordHash,
        TenantId = Guid.NewGuid(),
        IsActive = true
    };

    [Fact]
    public async Task Login_UpgradesALegacyHash_ToPbkdf2_AndStillWorksAfterwards()
    {
        await using var db = NewDb();
        db.Users.Add(NewUser(LegacySha256("OldPassw0rd!")));
        await db.SaveChangesAsync();
        var service = new AccountService(db, new FakeTokenService(), NullLogger<AccountService>.Instance, new ConfigurationBuilder().Build());

        await service.LoginAsync(new LoginDto { Email = "ama@example.com", Password = "OldPassw0rd!" });

        var stored = (await db.Users.AsNoTracking().SingleAsync()).PasswordHash;
        Assert.StartsWith("v2.", stored);
        await service.LoginAsync(new LoginDto { Email = "ama@example.com", Password = "OldPassw0rd!" });
    }

    [Fact]
    public async Task Login_WithTheWrongPassword_LeavesALegacyHashAlone()
    {
        await using var db = NewDb();
        var legacy = LegacySha256("OldPassw0rd!");
        db.Users.Add(NewUser(legacy));
        await db.SaveChangesAsync();
        var service = new AccountService(db, new FakeTokenService(), NullLogger<AccountService>.Instance, new ConfigurationBuilder().Build());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.LoginAsync(new LoginDto { Email = "ama@example.com", Password = "Wrong-guess1" }));

        Assert.Equal(legacy, (await db.Users.AsNoTracking().SingleAsync()).PasswordHash);
    }

    // ------------------------------------------------------------------ password reset

    private sealed class RecordingEmailSender : IEmailSender
    {
        public List<(string To, string Subject, string Html)> Sent { get; } = new();

        public Task SendEmailAsync(string to, string subject, string htmlMessage, string? display = "Campus Hostels")
        {
            Sent.Add((to, subject, htmlMessage));
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingWhatsApp : IWhatsAppService
    {
        public List<(string To, string Message)> Sent { get; } = new();

        public Task<WhatsAppSendResult> SendTextMessageAsync(string to, string message)
        {
            Sent.Add((to, message));
            return Task.FromResult(new WhatsAppSendResult { Success = true, sent = true });
        }
    }

    private static (PasswordResetService Service, ApplicationDbContext Db, RecordingEmailSender Email, RecordingWhatsApp WhatsApp)
        NewResetService(string password = "Current-Passw0rd!")
    {
        var db = NewDb();
        db.Users.Add(NewUser(PasswordHasher.Hash(password)));
        db.SaveChanges();

        var email = new RecordingEmailSender();
        var whatsApp = new RecordingWhatsApp();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["App:BaseUrl"] = "https://app.example" })
            .Build();
        var service = new PasswordResetService(db, email, whatsApp, NullLogger<PasswordResetService>.Instance, config);
        return (service, db, email, whatsApp);
    }

    private static string TokenFrom(string linkContainingText)
    {
        var decoded = WebUtility.HtmlDecode(linkContainingText);
        var match = Regex.Match(decoded, @"token=([^&""\s]+)");
        Assert.True(match.Success, "no reset token in message");
        return WebUtility.UrlDecode(match.Groups[1].Value);
    }

    [Fact]
    public async Task ResetLink_AlwaysUsesTheConfiguredBaseUrl()
    {
        var (service, _, email, _) = NewResetService();

        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });

        var html = Assert.Single(email.Sent).Html;
        Assert.Contains("href=\"https://app.example/password-reset?token=", html);
        Assert.Contains("Email=ama%40example.com", WebUtility.HtmlDecode(html));
    }

    [Fact]
    public async Task RequestingAResetForAnUnknownAccount_SendsNothingAndDoesNotThrow()
    {
        var (service, _, email, whatsApp) = NewResetService();

        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "nobody@example.com" });
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { PhoneNumber = "+233999999999" });

        Assert.Empty(email.Sent);
        Assert.Empty(whatsApp.Sent);
    }

    [Fact]
    public async Task ResetRequests_AreThrottledToFivePerHour()
    {
        var (service, db, email, _) = NewResetService();

        for (var i = 0; i < 8; i++)
        {
            await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        }

        Assert.Equal(5, email.Sent.Count);
        Assert.Equal(5, await db.PasswordResetTokens.CountAsync());
    }

    [Fact]
    public async Task OnlyTheNewestResetLinkWorks()
    {
        var (service, _, email, _) = NewResetService();
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        var oldToken = TokenFrom(email.Sent[0].Html);
        var newToken = TokenFrom(email.Sent[1].Html);

        Assert.False(await service.VerifyResetTokenAsync(new ResetPasswordDto { Email = "ama@example.com", Token = oldToken }));
        Assert.True(await service.VerifyResetTokenAsync(new ResetPasswordDto { Email = "ama@example.com", Token = newToken }));
    }

    [Fact]
    public async Task VerifyReset_NeverRevealsWhetherAPasswordMatches()
    {
        var (service, _, email, _) = NewResetService("Current-Passw0rd!");
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        var token = TokenFrom(email.Sent[0].Html);

        // Proposed password equals the current one: used to throw, which leaked it. Now it's just a token check.
        Assert.True(await service.VerifyResetTokenAsync(new ResetPasswordDto { Email = "ama@example.com", Token = token, NewPassword = "Current-Passw0rd!" }));
        // A made-up token gives the same answer whatever password is guessed.
        Assert.False(await service.VerifyResetTokenAsync(new ResetPasswordDto { Email = "ama@example.com", Token = "made-up", NewPassword = "Current-Passw0rd!" }));
        Assert.False(await service.VerifyResetTokenAsync(new ResetPasswordDto { Email = "ama@example.com", Token = "made-up", NewPassword = "Something-else1" }));
    }

    [Fact]
    public async Task ResetPassword_RejectsTheSamePasswordOnlyForAValidToken_AndKeepsTheTokenUsable()
    {
        var (service, db, email, _) = NewResetService("Current-Passw0rd!");
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        var token = TokenFrom(email.Sent[0].Html);

        // Without a valid token there is no information, just "false".
        Assert.False(await service.ResetPasswordAsync(new ResetPasswordDto { Email = "ama@example.com", Token = "made-up", NewPassword = "Current-Passw0rd!" }));

        // With one, the same password is refused...
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ResetPasswordAsync(new ResetPasswordDto { Email = "ama@example.com", Token = token, NewPassword = "Current-Passw0rd!" }));

        // ...but the token survives so a different password can still be chosen.
        Assert.True(await service.ResetPasswordAsync(new ResetPasswordDto { Email = "ama@example.com", Token = token, NewPassword = "Brand-new-Passw0rd!" }));
        var user = await db.Users.AsNoTracking().SingleAsync();
        Assert.True(PasswordHasher.Verify("Brand-new-Passw0rd!", user.PasswordHash));
        Assert.False(PasswordHasher.Verify("Current-Passw0rd!", user.PasswordHash));

        // And it cannot be used a second time.
        Assert.False(await service.ResetPasswordAsync(new ResetPasswordDto { Email = "ama@example.com", Token = token, NewPassword = "Yet-another-Passw0rd!" }));
    }

    [Fact]
    public async Task ResetPassword_Works_ForALinkSentByPhone_AndClearsTheLockout()
    {
        var (service, db, _, whatsApp) = NewResetService();
        var user = await db.Users.SingleAsync();
        user.FailedLoginAttempts = 5;
        await db.SaveChangesAsync();

        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { PhoneNumber = "+233201234567" });
        var message = Assert.Single(whatsApp.Sent).Message;
        Assert.Contains("PhoneNumber=", message); // the reset page reads this exact key
        var token = TokenFrom(message);

        Assert.True(await service.ResetPasswordAsync(new ResetPasswordDto { PhoneNumber = "+233201234567", Token = token, NewPassword = "Brand-new-Passw0rd!" }));
        Assert.Equal(0, (await db.Users.AsNoTracking().SingleAsync()).FailedLoginAttempts);
    }

    [Fact]
    public async Task ResetPassword_RejectsShortPasswords()
    {
        var (service, _, email, _) = NewResetService();
        await service.RequestPasswordResetAsync(new RequestPasswordResetDto { Email = "ama@example.com" });
        var token = TokenFrom(email.Sent[0].Html);

        Assert.False(await service.ResetPasswordAsync(new ResetPasswordDto { Email = "ama@example.com", Token = token, NewPassword = "short" }));
    }
}
