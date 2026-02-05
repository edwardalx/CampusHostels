using System.Runtime.CompilerServices;
using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Mapping;

public partial class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Property, PropertyDto>();
        CreateMap<PropertyCreateDto, Property>();
        CreateMap<InitializePaymentRequest, Payment>();
        ConfigureExtraMappings();
    }

    partial void ConfigureExtraMappings();
}
