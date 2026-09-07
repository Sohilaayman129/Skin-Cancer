using System.Text.Json.Serialization;

namespace Grounded.Api.Models;

public class AskRequest
{
    [JsonPropertyName("question")]
    public string Question { get; set; } = string.Empty;

    [JsonPropertyName("sessionId")]
    public string? SessionId { get; set; }

    [JsonPropertyName("isTemporary")]
    public bool IsTemporary { get; set; } = false;
}

public class CitationModel
{
    [JsonPropertyName("document")]
    public string Document { get; set; } = "USPSTF Skin Cancer Prevention Guideline (2018)";

    [JsonPropertyName("section")]
    public string Section { get; set; } = string.Empty;

    [JsonPropertyName("page")]
    public int Page { get; set; } = 1;

    [JsonPropertyName("chunk_id")]
    public string ChunkId { get; set; } = string.Empty;
}

public class EvidenceItemModel
{
    [JsonPropertyName("claim")]
    public string Claim { get; set; } = string.Empty;

    [JsonPropertyName("citation")]
    public CitationModel Citation { get; set; } = new();

    [JsonPropertyName("passage")]
    public string? Passage { get; set; }
}

public class RetrievedChunkModel
{
    [JsonPropertyName("document")]
    public string Document { get; set; } = "USPSTF 2018 Skin Cancer Guideline";

    [JsonPropertyName("section")]
    public string Section { get; set; } = string.Empty;

    [JsonPropertyName("page")]
    public int Page { get; set; } = 1;

    [JsonPropertyName("chunk_id")]
    public string ChunkId { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public double Score { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class ValidationModel
{
    [JsonPropertyName("citations_verified")]
    public int CitationsVerified { get; set; }

    [JsonPropertyName("invented_citations")]
    public List<string> InventedCitations { get; set; } = new();
}

public class AskResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "Answered";

    [JsonPropertyName("recommendation")]
    public string Recommendation { get; set; } = string.Empty;

    [JsonPropertyName("supporting_evidence")]
    public List<EvidenceItemModel> SupportingEvidence { get; set; } = new();

    [JsonPropertyName("confidence")]
    public string Confidence { get; set; } = "High";

    [JsonPropertyName("missing_information")]
    public string MissingInformation { get; set; } = "None identified in guideline scope.";

    [JsonPropertyName("safety_note")]
    public string SafetyNote { get; set; } = string.Empty;

    [JsonPropertyName("risk_tier")]
    public string RiskTier { get; set; } = "Allowed";

    [JsonPropertyName("decision_path")]
    public string DecisionPath { get; set; } = "Dense Retrieval → Grounded Generation → Validation";

    [JsonPropertyName("retrieved_chunks")]
    public List<RetrievedChunkModel> RetrievedChunks { get; set; } = new();

    [JsonPropertyName("weak_threshold")]
    public double WeakThreshold { get; set; } = 0.57;

    [JsonPropertyName("top_score")]
    public double TopScore { get; set; } = 0.85;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "dotnet-rag";

    [JsonPropertyName("validation")]
    public ValidationModel Validation { get; set; } = new();
}

public class HealthResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = "ok";

    [JsonPropertyName("framework")]
    public string Framework { get; set; } = ".NET 9.0 (C#)";

    [JsonPropertyName("index_loaded")]
    public bool IndexLoaded { get; set; } = true;

    [JsonPropertyName("chunk_count")]
    public int ChunkCount { get; set; } = 28;

    [JsonPropertyName("llm_mode")]
    public string LlmMode { get; set; } = "live";

    [JsonPropertyName("python_rag_available")]
    public bool PythonRagAvailable { get; set; } = false;
}

public class ChatMessageDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("role")]
    public string Role { get; set; } = "user"; // "user" | "assistant"

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("response")]
    public AskResponse? Response { get; set; }
}

public class ChatSessionDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("title")]
    public string Title { get; set; } = "New Clinical Consultation";

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("isTemporary")]
    public bool IsTemporary { get; set; } = false;

    [JsonPropertyName("messages")]
    public List<ChatMessageDto> Messages { get; set; } = new();
}
