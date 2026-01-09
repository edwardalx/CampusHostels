using System;
using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Services
{
    public class PlaceholderService
    {
        public User CreateSampleUser()
        {
            return new User { PhoneNumber = "sample", Email = "sample@example.com" };
        }
    }
}
