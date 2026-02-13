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

using System.ComponentModel.DataAnnotations;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPaystackService _paystack;
    private readonly IMapper _mapper;

    public PaymentsController(IPaymentService paymentService, IPaystackService paystack, IMapper mapper)
    {
        _paymentService = paymentService;
        _paystack = paystack;
        _mapper = mapper;
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

        // Let the service handle verification and DB updates
        Payment payment;
        try
        {
            payment = await _paymentService.VerifyPaymentAsync(req.Reference);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }

        // Map to DTO
        var dto = new PaymentResponseDto
        {
            Reference = payment.Reference,
            Amount = payment.Amount,
            Currency = payment.Currency,
            Status = payment.Status.ToString(),
            Channel = payment.Channel!,
            PaidAt = payment.PaidAt
        };

        return Ok(dto);
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

    /// <summary>
    /// Tolerant verify endpoint for testing: accepts raw JSON or plain text reference bodies.
    /// Useful from curl/powershell when model-binding fails.
    /// </summary>
    [HttpPost("verify-raw")]
    public async Task<IActionResult> VerifyRaw()
    {
        Request.EnableBuffering();
        using var sr = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await sr.ReadToEndAsync();
        Request.Body.Position = 0;

        string? reference = null;
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("reference", out var prop))
            {
                reference = prop.GetString();
            }
        }
        catch
        {
            // Not JSON — fallthrough to plain text
        }

        if (string.IsNullOrWhiteSpace(reference))
        {
            // Try plain text body (trim quotes/newlines)
            reference = body?.Trim().Trim('"', '\'', '\r', '\n');
        }

        if (string.IsNullOrWhiteSpace(reference)) return BadRequest("reference required");

        var (isValid, actualChannel, gatewayResponse) = await _paystack.VerifyTransactionAsync(reference);
        if (!isValid) return BadRequest("Payment not successful or not found");

        var payment = await _paymentService.VerifyPaymentAsync(reference);
        return Ok(payment);
    }
}

