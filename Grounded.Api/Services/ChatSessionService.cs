using System.Collections.Concurrent;
using Grounded.Api.Models;

namespace Grounded.Api.Services;

public interface IChatSessionService
{
    IEnumerable<ChatSessionDto> GetAllSessions();
    ChatSessionDto? GetSession(string id);
    ChatSessionDto CreateSession(string? title = null, bool isTemporary = false);
    bool DeleteSession(string id);
    ChatMessageDto AddMessage(string sessionId, string role, string content, AskResponse? response = null);
}

public class ChatSessionService : IChatSessionService
{
    private readonly ConcurrentDictionary<string, ChatSessionDto> _sessions = new();

    public ChatSessionService()
    {
        // Seed an initial demo clinical session
        var defaultSession = new ChatSessionDto
        {
            Id = "session-sample-1",
            Title = "Youth Sun Protection Counseling",
            CreatedAt = DateTime.UtcNow.AddMinutes(-30),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-5),
            IsTemporary = false,
            Messages = new List<ChatMessageDto>
            {
                new ChatMessageDto
                {
                    Role = "user",
                    Content = "What does USPSTF recommend for counseling young adults and children?",
                    Timestamp = DateTime.UtcNow.AddMinutes(-30)
                },
                new ChatMessageDto
                {
                    Role = "assistant",
                    Content = "According to the USPSTF 2018 Recommendation, clinicians should counsel persons aged 6 months to 24 years with fair skin types to minimize UV radiation exposure to reduce skin cancer risk (Grade B recommendation).",
                    Timestamp = DateTime.UtcNow.AddMinutes(-29),
                    Response = new AskResponse
                    {
                        Status = "Answered",
                        Recommendation = "The USPSTF recommends counseling young adults, adolescents, children, and parents of young children aged 6 months to 24 years with fair skin types about minimizing UV exposure.",
                        Confidence = "High",
                        RiskTier = "Allowed",
                        TopScore = 0.92,
                        SupportingEvidence = new List<EvidenceItemModel>
                        {
                            new EvidenceItemModel
                            {
                                Claim = "Counseling persons aged 6 months to 24 years with fair skin types reduces skin cancer risk (Grade B).",
                                Citation = new CitationModel
                                {
                                    Document = "USPSTF 2018 Skin Cancer Guideline",
                                    Section = "Recommendation Summary",
                                    Page = 1,
                                    ChunkId = "USPSTF_2018_P1_C1"
                                },
                                Passage = "The USPSTF recommends counseling young adults, adolescents, children, and parents of young children about minimizing exposure to ultraviolet (UV) radiation for persons aged 6 months to 24 years with fair skin types (Grade B)."
                            }
                        }
                    }
                }
            }
        };

        _sessions.TryAdd(defaultSession.Id, defaultSession);
    }

    public IEnumerable<ChatSessionDto> GetAllSessions()
    {
        return _sessions.Values
            .Where(s => !s.IsTemporary)
            .OrderByDescending(s => s.UpdatedAt);
    }

    public ChatSessionDto? GetSession(string id)
    {
        _sessions.TryGetValue(id, out var session);
        return session;
    }

    public ChatSessionDto CreateSession(string? title = null, bool isTemporary = false)
    {
        var session = new ChatSessionDto
        {
            Id = Guid.NewGuid().ToString(),
            Title = string.IsNullOrWhiteSpace(title) ? "New Clinical Consultation" : title,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsTemporary = isTemporary
        };

        _sessions.TryAdd(session.Id, session);
        return session;
    }

    public bool DeleteSession(string id)
    {
        return _sessions.TryRemove(id, out _);
    }

    public ChatMessageDto AddMessage(string sessionId, string role, string content, AskResponse? response = null)
    {
        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            session = CreateSession();
            sessionId = session.Id;
        }

        var message = new ChatMessageDto
        {
            Id = Guid.NewGuid().ToString(),
            Role = role,
            Content = content,
            Timestamp = DateTime.UtcNow,
            Response = response
        };

        session.Messages.Add(message);
        session.UpdatedAt = DateTime.UtcNow;

        if (session.Messages.Count == 1 && role == "user")
        {
            // Auto-title from first user prompt
            var cleanTitle = content.Length > 40 ? content[..40] + "..." : content;
            session.Title = cleanTitle;
        }

        return message;
    }
}
