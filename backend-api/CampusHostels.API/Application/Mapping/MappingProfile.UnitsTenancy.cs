using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;

namespace CampusHostels.API.Application.Mapping;

public partial class MappingProfile
{
    partial void ConfigureExtraMappings()
    {
        // Unit mappings
        CreateMap<Unit, UnitDto>()
            .ForMember(d => d.UnitType, opt => opt.MapFrom(s => s.UnitType.ToString()));
        CreateMap<UnitCreateDto, Unit>()
            .ForMember(d => d.UnitType, opt => opt.MapFrom(s => Enum.Parse<UnitType>(s.UnitType)));

        // Tenancy mapping
        CreateMap<TenancyCreateDto, TenancyAgreement>();
    }
}
