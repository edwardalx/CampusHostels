using CampusHostels.API.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>Initialize a payment for a tenancy.</summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromQuery] int tenancyId, [FromQuery] decimal amount)
    {
        try
        {
            var (reference, authUrl) = await _paymentService.InitializePaymentAsync(tenancyId, amount);
            return Ok(new { reference, authorizationUrl = authUrl });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Verify a payment by reference.</summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromQuery] string reference)
    {
        try
        {
            var payment = await _paymentService.VerifyPaymentAsync(reference);
            return Ok(new { payment.Id, payment.Reference, payment.Amount, payment.Status, payment.CreatedAt });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Get all payments for a tenancy.</summary>
    [HttpGet("tenancy/{tenancyId}")]
    public async Task<IActionResult> GetByTenancy(int tenancyId)
    {
        var payments = await _paymentService.GetPaymentsByTenancyAsync(tenancyId);
        return Ok(payments);
    }

    /// <summary>Get a payment by id.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var payment = await _paymentService.GetPaymentByIdAsync(id);
        if (payment is null) return NotFound();
        return Ok(payment);
    }
}
