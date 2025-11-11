using System;
using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Services
{
    public class PlaceholderService
    {
        public Tenant CreateSampleTenant()
        {
            return new Tenant { Id = Guid.NewGuid(), UserName = "sample", Email = "sample@example.com" };
        }
    }
}
