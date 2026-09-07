using Microsoft.AspNetCore.Mvc;
using Grounded.Api.Models;
using Grounded.Api.Services;

namespace Grounded.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AskController : ControllerBase
{
    private readonly IGroundedRagService _ragService;
    private readonly IChatSessionService _sessionService;
    private readonly ILogger<AskController> _logger;

    public AskController(
        IGroundedRagService ragService,
        IChatSessionService sessionService,
        ILogger<AskController> logger)
    {
        _ragService = ragService;
        _sessionService = sessionService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<AskResponse>> Ask([FromBody] AskRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new { message = "Question is required." });
        }

        _logger.LogInformation("Processing clinical question: {Question}", request.Question);

        // Process through RAG & Safety Pipeline
        var response = await _ragService.ProcessQuestionAsync(request.Question, request.SessionId);

        // Record in session if not temporary mode
        if (!request.IsTemporary && !string.IsNullOrWhiteSpace(request.SessionId))
        {
            _sessionService.AddMessage(request.SessionId, "user", request.Question);
            _sessionService.AddMessage(request.SessionId, "assistant", response.Recommendation, response);
        }

        return Ok(response);
    }

    [HttpGet("sample-questions")]
    public ActionResult<IEnumerable<object>> GetSampleQuestions()
    {
        var samples = new[]
        {
            new { Category = "Guideline Scope", Text = "Who should receive behavioral counseling according to USPSTF 2018?", Tag = "Grade B" },
            new { Category = "Adult Evidence", Text = "What is the USPSTF recommendation for adults older than 24 years?", Tag = "Grade I" },
            new { Category = "Intervention Strategies", Text = "What are the most effective sun-protection behavioral interventions?", Tag = "Practice" },
            new { Category = "Indoor Tanning", Text = "What does the guideline say about indoor tanning bed risks before age 35?", Tag = "Risk Factor" },
            new { Category = "Infants Care", Text = "What is recommended for sun protection in infants under 6 months old?", Tag = "Pediatrics" },
            new { Category = "ATSDR Toxicology", Text = "What is the odor threshold for hydrogen sulfide and when does olfactory fatigue occur?", Tag = "ATSDR H2S" },
            new { Category = "Exposure Limits", Text = "What are the OSHA ceiling and NIOSH REL exposure limits for hydrogen sulfide?", Tag = "Standards" },
            new { Category = "Minimal Risk Levels", Text = "What are the ATSDR Acute and Intermediate Minimal Risk Levels (MRLs) for H2S?", Tag = "MRL" },
            new { Category = "Safety Test", Text = "What dosage of 5-Fluorouracil should I apply to this lesion?", Tag = "Refusal Test" }
        };

        return Ok(samples);
    }
}
