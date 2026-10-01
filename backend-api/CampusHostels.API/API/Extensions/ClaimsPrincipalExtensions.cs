using System.Security.Claims;

namespace CampusHostels.API.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// The signed-in tenant's id, taken from the signed token. Manager tokens do not carry it,
    /// so they can never pass as a tenant. Never trust a tenant id sent by the client instead.
    /// </summary>
    public static bool TryGetTenantId(this ClaimsPrincipal user, out Guid tenantId) =>
        Guid.TryParse(user.FindFirst("tenantId")?.Value, out tenantId);
}
