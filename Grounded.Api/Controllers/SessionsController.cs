using Microsoft.AspNetCore.Mvc;
using Grounded.Api.Models;
using Grounded.Api.Services;

namespace Grounded.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly IChatSessionService _sessionService;

    public SessionsController(IChatSessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public ActionResult<IEnumerable<ChatSessionDto>> GetAll()
    {
        return Ok(_sessionService.GetAllSessions());
    }

    [HttpGet("{id}")]
    public ActionResult<ChatSessionDto> GetById(string id)
    {
        var session = _sessionService.GetSession(id);
        if (session == null) return NotFound(new { message = "Session not found." });
        return Ok(session);
    }

    [HttpPost]
    public ActionResult<ChatSessionDto> Create([FromBody] CreateSessionRequest? request)
    {
        var session = _sessionService.CreateSession(request?.Title, request?.IsTemporary ?? false);
        return CreatedAtAction(nameof(GetById), new { id = session.Id }, session);
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(string id)
    {
        var result = _sessionService.DeleteSession(id);
        if (!result) return NotFound(new { message = "Session not found." });
        return NoContent();
    }
}

public class CreateSessionRequest
{
    public string? Title { get; set; }
    public bool IsTemporary { get; set; } = false;
}
