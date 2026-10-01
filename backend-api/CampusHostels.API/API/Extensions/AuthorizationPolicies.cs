using Microsoft.AspNetCore.Authorization;

namespace CampusHostels.API.API.Extensions;

public static class AuthorizationPolicies
{
    public const string RequireManager = "RequireManager";
    public const string RequireManagerSession = "RequireManagerSession";
    public const string RequireSuperManager = "RequireSuperManager";

    /// <summary>
    /// A manager who still has a temporary or reset password carries the "mustChangePassword" claim.
    /// Such a token may only reach the endpoints that let them change it (RequireManagerSession);
    /// every other manager endpoint is refused until they have done so.
    /// </summary>
    public static void Configure(AuthorizationOptions options)
    {
        options.AddPolicy(RequireManager, policy => policy
            .RequireClaim("scope", "manager")
            .RequireAssertion(context => !context.User.HasClaim("mustChangePassword", "true")));

        options.AddPolicy(RequireManagerSession, policy => policy
            .RequireClaim("scope", "manager"));

        options.AddPolicy(RequireSuperManager, policy => policy
            .RequireClaim("scope", "manager")
            .RequireClaim("managerTier", "Super")
            .RequireAssertion(context => !context.User.HasClaim("mustChangePassword", "true")));
    }
}
