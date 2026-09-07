using Microsoft.AspNetCore.Mvc;
using Grounded.Api.Models;
using Grounded.Api.Services;

namespace Grounded.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IGroundedRagService _ragService;

    public HealthController(IGroundedRagService ragService)
    {
        _ragService = ragService;
    }

    [HttpGet]
    public async Task<ActionResult<HealthResponse>> GetHealth()
    {
        var health = await _ragService.GetHealthAsync();
        return Ok(health);
    }
}
