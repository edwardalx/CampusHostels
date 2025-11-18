using FluentValidation;
using CampusHostels.API.Application.DTOs;

namespace CampusHostels.API.Application.Validators;

public class UnitCreateDtoValidator : AbstractValidator<UnitCreateDto>
{
    public UnitCreateDtoValidator()
    {
        RuleFor(x => x.PropertyId).GreaterThan(0);
        RuleFor(x => x.Floor).GreaterThanOrEqualTo(0);
        RuleFor(x => x.RoomNumber).MaximumLength(50).When(x => x.RoomNumber != null);
    RuleFor(x => x.Cost).GreaterThanOrEqualTo(0m).When(x => x.Cost.HasValue);
        RuleFor(x => x.MaxNoOfPeople).GreaterThan(0).When(x => x.MaxNoOfPeople.HasValue);
        RuleFor(x => x.UnitType).NotEmpty();
    }
}
