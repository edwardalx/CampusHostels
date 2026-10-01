using System.IO;
using System.Text;
using System.Text.Json;
using AutoMapper;
using System.Threading.Tasks;
using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CampusHostels.API.Application.DTOs;
using CampusHostels.API.Domain.Entities;
using CampusHostels.API.API.Extensions;
using CampusHostels.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // everything here needs a signed-in tenant, except the Paystack webhook (signature-checked)
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPaystackService _paystack;
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _db;

    public PaymentsController(IPaymentService paymentService, IPaystackService paystack, IMapper mapper, ApplicationDbContext db)
    {
        _paymentService = paymentService;
        _paystack = paystack;
        _mapper = mapper;
        _db = db;
    }

    //     public class InitializeRequest
    // {
    //     [Required]
    //     public int TenancyId { get; set; }

    //     [Required]
    //     [Range(1, double.MaxValue)]
    //     public decimal Amount { get; set; }

    //     [Required]
    //     [EmailAddress]
    //     public string Email { get; set; } = string.Empty;

    //     public string? CallbackUrl { get; set; }

    //     [Required]
    //     [Phone]
    //     public string Phone { get; set; } = string.Empty;

    //     public string? Provider { get; set; }

    //     public int? UnitId { get; set; }

    //     [Required]
    //     public string Currency { get; set; } = "GHS";
    // }

    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] InitializePaymentRequest req)
    {
        if (!User.TryGetTenantId(out var tenantId)) return Unauthorized();

        // A tenant may only start a payment against their own tenancy.
        var ownsTenancy = await _db.TenancyAgreements.AnyAsync(t => t.Id == req.TenancyId && t.TenantId == tenantId);
        if (!ownsTenancy) return Forbid();

        // var entity = _mapper.Map<Domain.Entities.Payment>(req);
        var (reference, authorizationUrl) = await _paymentService.InitializePaymentAsync(req.TenancyId, req.Amount, req.Email, req.CallbackUrl!, req.Phone, req.Provider.ToString(), req.UnitId, req.Currency);
        return Ok(new { reference, authorizationUrl });
    }

    // public class VerifyRequest
    // {
    //     public string Reference { get; set; } = string.Empty;
    // }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyRequest req)
    {

        if (req == null || string.IsNullOrWhiteSpace(req.Reference))
            return BadRequest("Reference is required");

        if (!User.TryGetTenantId(out var tenantId)) return Unauthorized();

        // Only the tenant who made the payment can ask for it to be verified (the webhook covers everyone else).
        var paymentTenantId = await _db.Payments
            .Where(p => p.Reference == req.Reference)
            .Select(p => (Guid?)p.TenantId)
            .FirstOrDefaultAsync();
        if (paymentTenantId is null) return NotFound("Payment not found");
        if (paymentTenantId != tenantId) return Forbid();

        // Let the service handle verification and DB updates
        // Payment payment;
        try
        {
            var payments = await _paymentService.VerifyPaymentAsync(req.Reference);
            return Ok(payments);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        // Read raw body
        Request.EnableBuffering();
        using var sr = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await sr.ReadToEndAsync();
        Request.Body.Position = 0;

        var signature = Request.Headers.ContainsKey("x-paystack-signature")
            ? Request.Headers["x-paystack-signature"].ToString()
            : string.Empty;

        var valid = await _paystack.ValidateWebhookSignatureAsync(body, signature);
        if (!valid) return BadRequest();

        using var doc = JsonDocument.Parse(body);
        var evt = doc.RootElement.GetProperty("event").GetString();

        if (evt == "charge.success")
        {
            var data = doc.RootElement.GetProperty("data");
            var reference = data.GetProperty("reference").GetString();
            if (!string.IsNullOrEmpty(reference))
            {
                // Let PaymentService handle DB update
                await _paymentService.VerifyPaymentAsync(reference);
            }
        }

        return Ok();
    }

    [HttpGet("tenancy/{tenancyId}")]
    public async Task<IActionResult> GetPaymentsByTenancy(int tenancyId)
    {
        if (!User.TryGetTenantId(out var tenantId)) return Unauthorized();

        var ownsTenancy = await _db.TenancyAgreements.AnyAsync(t => t.Id == tenancyId && t.TenantId == tenantId);
        if (!ownsTenancy) return NotFound();

        // Return a DTO, not the entity (which carries the tenant's email, phone and id).
        var payments = (await _paymentService.GetPaymentsByTenancyAsync(tenancyId))
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                Amount = p.Amount,
                Reference = p.Reference,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt,
                Status = p.Status.ToString(),
                Channel = p.Channel,
                Currency = p.Currency
            });
        return Ok(payments);
    }
    [HttpGet("tenant/{tenantId}")]
    public async Task<IActionResult> GetPaymentsByTenant(Guid tenantId)
    {
        if (!User.TryGetTenantId(out var callerTenantId)) return Unauthorized();
        if (callerTenantId != tenantId) return Forbid();

        var payments = await _paymentService.GetPaymentsByTenantAsync(tenantId);
        return Ok(payments);
    }
}

