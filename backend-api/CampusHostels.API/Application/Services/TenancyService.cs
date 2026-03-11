using AutoMapper;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Application.Interfaces;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.Infrastructure.Repositories;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Services;

public class TenancyService : ITenancyService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenancyRepository _repo;
    private readonly IMapper _mapper;

    public TenancyService(ITenancyRepository repo, IMapper mapper, ApplicationDbContext db)
    {
        _repo = repo;
        _mapper = mapper;
        _db = db;
    }

    public async Task<TenancyAgreement> CreateAsync(
      TenancyCreateDto dto,
      Guid tenantId
  )
    {
        var entity = _mapper.Map<TenancyAgreement>(dto);

        entity.TenantId = tenantId;
        entity.ComputeContractEndDate();

        var created = await _repo.AddAsync(entity);
        await _repo.SaveChangesAsync();

        return created;
    }

    public async Task<TenancyDetailsDto?> GetByIdAsync(int id)
    {
        var tenancy = await _repo.GetByIdAsync(id);
        if (tenancy == null) return null;

        var dto = new TenancyDetailsDto
        {
            Id = tenancy.Id,
            TotalAmountPaid = tenancy.TotalAmountPaid ?? 0m,
            Payments = tenancy.Payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                Amount = p.Amount,
                Reference = p.Reference,
                PaidAt = p.PaidAt,
                Status = p.Status.ToString(),
                Channel = p.Channel,
                Currency = p.Currency
            }).ToList(),
            Unit = tenancy.Unit != null ? new UnitDto
            {
                Id = tenancy.Unit.Id,
                Cost = tenancy.Unit.Cost
            } : null,
            Property = tenancy.Property != null ? new PropertyDto
            {
                Id = tenancy.Property.Id,
                Name = tenancy.Property.Name,
                Location = tenancy.Property.Location
            } : null
        };

        return dto;
    }

    public async Task<List<PaidTenancyDto>> GetPaidTenancyAsync(Guid tenantId)
    {
        var tenancies = await _repo.GetPaidTenancyAsync(tenantId);
        if (tenancies == null || !tenancies.Any()) return new List<PaidTenancyDto>();

        var dtos = tenancies.Select(tenancy => new PaidTenancyDto
        {
            Id = tenancy.Id,
            ContractStartDate = tenancy.ContractStartDate,
            ContractDurationMonths = tenancy.ContractDurationMonths,
            ContractEndDate = tenancy.ContractEndDate,
            TenantId = tenancy.TenantId,
            PropertyId = tenancy.PropertyId,
            UnitId = tenancy.UnitId,
            PropertyName = tenancy.Property?.Name,
            UnitName = tenancy.Unit?.RoomNumber,
            Cost = tenancy.Unit?.Cost ?? 0m,
            FirstName = tenancy.User!.FirstName,
            LastName = tenancy.User!.LastName,
            PhoneNumber= tenancy.User!.PhoneNumber,
            Email = tenancy.User!.Email,
            TotalAmountPaid = tenancy.TotalAmountPaid ?? 0m

        }).ToList();

        return dtos;
    }

}
