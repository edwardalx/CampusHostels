using System;

namespace CampusHostels.API.Domain.Entities
{
    /// <summary>
    /// Domain representation of a tenant/user. Minimal placeholder for initial scaffold.
    /// </summary>
    public class Tenant
    {
        public Guid Id { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public int? Age { get; set; }
    }
}
