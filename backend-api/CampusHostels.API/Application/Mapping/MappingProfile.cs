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
        ConfigureExtraMappings();
    }

    partial void ConfigureExtraMappings();
}
