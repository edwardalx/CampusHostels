using System.ComponentModel.DataAnnotations;
using CampusHostels.API.Domain.Enums;

namespace CampusHostels.API.Application.DTOs;

public class InitializePaymentRequest
{
    [Required]
    public int TenancyId { get; set; }

    [Required]
    [Range(1, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? CallbackUrl { get; set; }

    [Required]
    [Phone]
    public string Phone { get; set; } = string.Empty;

    public PaymentProvider? Provider { get; set; } = PaymentProvider.Paystack;

    public int? UnitId { get; set; }

    [Required]
    public string Currency { get; set; } = CurrencyTypes.GHS.ToString();
}