using CampusHostels.API.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CampusHostels.API.Application.Interfaces;

public interface IPaymentService
{
    /// <summary>Initialize a payment and return reference + auth URL.</summary>
    Task<(string Reference, string AuthorizationUrl)> InitializePaymentAsync(int tenancyId, decimal amount);

    /// <summary>Verify a payment by reference and update Payment/PaymentSummary records.</summary>
    Task<Payment> VerifyPaymentAsync(string reference);

    /// <summary>Get all payments for a tenancy.</summary>
    Task<IEnumerable<Payment>> GetPaymentsByTenancyAsync(int tenancyId);

    /// <summary>Get a payment by id.</summary>
    Task<Payment?> GetPaymentByIdAsync(int id);
}
