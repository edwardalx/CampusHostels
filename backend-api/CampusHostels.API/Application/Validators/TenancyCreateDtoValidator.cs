using FluentValidation;
using CampusHostels.API.Application.DTOs;

namespace CampusHostels.API.Application.Validators;

public class TenancyCreateDtoValidator : AbstractValidator<TenancyCreateDto>
{
    public TenancyCreateDtoValidator()
    {
        RuleFor(x => x.ContractStartDate).LessThanOrEqualTo(DateTime.UtcNow.AddYears(1));
        RuleFor(x => x.ContractDurationMonths).GreaterThan(0);
        // RuleFor(x => x.TenantId).NotEmpty();
        RuleFor(x => x.PropertyId).GreaterThan(0);
        RuleFor(x => x.UnitId).GreaterThan(0);
    }
}
