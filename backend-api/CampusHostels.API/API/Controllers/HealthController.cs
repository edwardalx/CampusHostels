using Microsoft.AspNetCore.Mvc;

namespace CampusHostels.API.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var urls = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Hosting.Server.IServer)) is not null
            ? new { status = "ok" }
            : new { status = "starting" };

        return Ok(new
        {
            service = "CampusHostels.API",
            uptime = System.Environment.TickCount64,
            urls
        });
    }
}
