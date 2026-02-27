using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IPaymentService
{
    /// <summary>Initialize a payment and return reference + auth URL.</summary>
    Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string callbackUrl);
    /// <summary>Extended initialize that accepts optional metadata and currency.</summary>
    Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount, string customerEmail, string callbackUrl, string? phone = null, string? provider = null, int? unitId = null, string currency = "GHS");
    // Backwards-compatible overload used by existing tests and callers
    Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount);

    /// <summary>Verify a payment by reference and update Payment/PaymentSummary records.</summary>
    Task<PaymentDto> VerifyPaymentAsync(string reference);

    /// <summary>Get all payments for a tenancy.</summary>
    Task<IEnumerable<Payment>> GetPaymentsByTenancyAsync(int tenancyId);

    /// <summary>Get a payment by id.</summary>
    Task<Payment?> GetPaymentByIdAsync(int id);

    /// <summary>Get a payment by tenantId.</summary>
    Task<IEnumerable<PaymentDto>> GetPaymentsByTenantAsync(Guid tenantId);
}
