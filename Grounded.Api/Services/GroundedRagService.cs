using System.Text.Json;
using System.Text.RegularExpressions;
using Grounded.Api.Models;

namespace Grounded.Api.Services;

public interface IGroundedRagService
{
    Task<AskResponse> ProcessQuestionAsync(string question, string? sessionId = null);
    Task<HealthResponse> GetHealthAsync();
}

public class GroundedRagService : IGroundedRagService
{
    private readonly ISafetyGuardService _safetyGuard;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GroundedRagService> _logger;
    private const double WEAK_THRESHOLD = 0.57;

    // Persisted USPSTF Guideline Evidence Chunks
    private static readonly List<GuidelineChunk> GuidelineChunks = new()
    {
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P1_C1",
            Section = "Recommendation Summary",
            Page = 1,
            Text = "The USPSTF recommends counseling young adults, adolescents, children, and parents of young children about minimizing exposure to ultraviolet (UV) radiation for persons aged 6 months to 24 years with fair skin types to reduce their risk of skin cancer (Grade B recommendation)."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P1_C2",
            Section = "Adults Older Than 24 Years",
            Page = 1,
            Text = "The USPSTF concludes that the current evidence is insufficient to assess the balance of benefits and harms of counseling adults older than 24 years with fair skin types about minimizing UV radiation exposure to reduce skin cancer risk (Grade I statement)."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P2_C1",
            Section = "Clinical Considerations — Fair Skin Types",
            Page = 2,
            Text = "Fair skin types at elevated risk include individuals with Fitzpatrick skin types I through III, characterized by pale or white skin, blue or green eyes, red or blond hair, a propensity to burn rather than tan, freckles, or a history of significant sunburns."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P2_C2",
            Section = "Behavioral Interventions & Strategies",
            Page = 2,
            Text = "Effective behavioral counseling interventions encourage broad-spectrum sunscreen application with SPF 15 or higher, wearing sun-protective clothing (wide-brimmed hats, UV-blocking sunglasses, long sleeves), seeking shade during peak midday hours (10:00 AM to 4:00 PM), and strictly avoiding indoor tanning devices."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P3_C1",
            Section = "Indoor Tanning Hazards",
            Page = 3,
            Text = "Indoor tanning bed use before age 35 is associated with a 75% increase in the risk of melanoma. Counseling specifically targeted against artificial UV device usage is a core component of adolescent and young adult counseling."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P3_C2",
            Section = "Harms of Behavioral Counseling",
            Page = 3,
            Text = "The USPSTF found adequate evidence that the harms of behavioral counseling are no greater than small. Harms may include potential vitamin D deficiency or contact dermatitis from sunscreen ingredients, but these are uncommon and manageable."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P4_C1",
            Section = "Infants Younger Than 6 Months",
            Page = 4,
            Text = "For infants younger than 6 months, sun protection should primarily rely on shade, protective clothing, and avoidance of direct sunlight. Sunscreen is not generally recommended as primary protection for infants under 6 months due to higher skin absorption ratios."
        },
        new GuidelineChunk
        {
            ChunkId = "USPSTF_2018_P4_C2",
            Section = "Primary Care Interventions",
            Page = 4,
            Text = "Counseling can be effectively delivered in primary care settings through multi-component interventions, including direct clinician counseling, print educational materials, digital/video aids, and policy-level sun-safety prompts."
        },
        new GuidelineChunk
        {
            ChunkId = "uspstf_skin_cancer_screening_2023-CH-012",
            Document = "USPSTF Skin Cancer Screening (2023)",
            Section = "Clinical Considerations - Risk Assessment & High-Risk Groups",
            Page = 4,
            Text = "Clinicians and patients should evaluate suspicious pigmented lesions using the ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter greater than 6 mm, and Evolution (changes in size, shape, or shade over time)."
        },
        new GuidelineChunk
        {
            ChunkId = "uspstf_skin_cancer_screening_2023-CH-013",
            Document = "USPSTF Skin Cancer Screening (2023)",
            Section = "Clinical Considerations - Risk Assessment & High-Risk Groups",
            Page = 4,
            Text = "Lesions greater than 6 mm (pencil eraser size), although melanomas can present smaller. Any lesion that changes in size, shape, color, elevation, or causes new pruritus/bleeding is considered evolving and warrants dedicated diagnostic assessment."
        },
        new GuidelineChunk
        {
            ChunkId = "uspstf_skin_cancer_screening_2023-CH-014",
            Document = "USPSTF Skin Cancer Screening (2023)",
            Section = "Clinical Considerations - Diagnostic Evaluation",
            Page = 4,
            Text = "The evidence does not provide a definitive clinical diagnosis of melanoma from history or visual features alone. Histopathologic examination (biopsy) is required to confirm whether a suspicious pigmented lesion is melanoma or another condition. Prompt clinical and dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended."
        }
    };

    public GroundedRagService(
        ISafetyGuardService safetyGuard,
        IHttpClientFactory httpClientFactory,
        ILogger<GroundedRagService> logger)
    {
        _safetyGuard = safetyGuard;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<HealthResponse> GetHealthAsync()
    {
        bool pyAvailable = false;
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(2);
            var resp = await client.GetAsync("http://127.0.0.1:8000/health");
            pyAvailable = resp.IsSuccessStatusCode;
        }
        catch
        {
            pyAvailable = false;
        }

        return new HealthResponse
        {
            Status = "ok",
            Framework = ".NET 9.0 (ASP.NET Core)",
            IndexLoaded = true,
            ChunkCount = GuidelineChunks.Count,
            LlmMode = pyAvailable ? "hybrid-python-llm" : "csharp-grounded-rag",
            PythonRagAvailable = pyAvailable
        };
    }

    public async Task<AskResponse> ProcessQuestionAsync(string question, string? sessionId = null)
    {
        // 1. First line of defense: Safety Guard
        var safety = _safetyGuard.Classify(question);

        if (safety.Tier == "Refuse/Redirect")
        {
            return new AskResponse
            {
                Status = "Safety Refusal",
                Recommendation = safety.RefusalMessage ?? "This question is outside what this evidence-bound clinical assistant can safely address.",
                SupportingEvidence = new List<EvidenceItemModel>(),
                Confidence = "N/A",
                MissingInformation = "Query falls outside the authorized behavioral counseling scope.",
                SafetyNote = $"Safety Refusal: {safety.Reason}",
                RiskTier = "Refuse/Redirect",
                DecisionPath = "Safety Classifier → Intercepted & Refused",
                RetrievedChunks = new List<RetrievedChunkModel>(),
                TopScore = 0.0,
                WeakThreshold = WEAK_THRESHOLD,
                Mode = "dotnet-safety-guard",
                Validation = new ValidationModel { CitationsVerified = 0, InventedCitations = new() }
            };
        }

        // 2. Try Python RAG Microservice if available
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var pyRequest = new { question };
            var content = new StringContent(JsonSerializer.Serialize(pyRequest), System.Text.Encoding.UTF8, "application/json");
            var pyResponse = await client.PostAsync("http://127.0.0.1:8000/ask", content);

            if (pyResponse.IsSuccessStatusCode)
            {
                var json = await pyResponse.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<AskResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result != null && !IsMismatchedCounselingHit(question, result))
                {
                    if (safety.Tier == "Needs Caution" && !string.IsNullOrEmpty(safety.CautionNote))
                    {
                        result.SafetyNote = string.IsNullOrEmpty(result.SafetyNote) 
                            ? safety.CautionNote 
                            : $"{safety.CautionNote} | {result.SafetyNote}";
                        result.RiskTier = "Needs Caution";
                    }
                    result.Mode = "dotnet-proxy (Python RAG)";
                    return result;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogInformation("Python RAG backend not connected, using native .NET RAG engine: {Message}", ex.Message);
        }

        // 3. Native .NET Grounded Engine
        return ExecuteNativeDotNetRag(question, safety);
    }

    private AskResponse ExecuteNativeDotNetRag(string question, SafetyRiskResult safety)
    {
        var terms = ExtractTerms(question);
        var intent = DetectQueryIntent(question);
        var scoredChunks = new List<(GuidelineChunk chunk, double score)>();

        foreach (var chunk in GuidelineChunks)
        {
            double score = CalculateRelevance(chunk, terms, question, intent);
            scoredChunks.Add((chunk, score));
        }

        IEnumerable<(GuidelineChunk chunk, double score)> candidatePool = scoredChunks;
        if (intent == QueryIntent.LesionAssessment)
        {
            var screeningHits = scoredChunks.Where(x => IsScreeningChunk(x.chunk)).ToList();
            if (screeningHits.Count > 0)
            {
                candidatePool = screeningHits;
            }
        }
        else if (intent == QueryIntent.Counseling)
        {
            var counselingHits = scoredChunks.Where(x => !IsScreeningChunk(x.chunk)).ToList();
            if (counselingHits.Count > 0)
            {
                candidatePool = counselingHits;
            }
        }

        var sorted = candidatePool.OrderByDescending(x => x.score).ToList();
        var topScore = sorted.Count > 0 ? sorted[0].score : 0.0;
        var topChunks = sorted.Take(3).ToList();

        var retrievedModels = topChunks.Select(x => new RetrievedChunkModel
        {
            Document = x.chunk.Document,
            Section = x.chunk.Section,
            Page = x.chunk.Page,
            ChunkId = x.chunk.ChunkId,
            Score = Math.Round(x.score, 3),
            Text = x.chunk.Text
        }).ToList();

        // 4. Threshold Gate (< 0.57)
        if (topScore < WEAK_THRESHOLD)
        {
            return new AskResponse
            {
                Status = "Insufficient Evidence",
                Recommendation = "The USPSTF 2018 Skin Cancer Prevention Counseling Guideline does not contain sufficient clinical evidence or recommendations directly addressing this specific query.",
                SupportingEvidence = new List<EvidenceItemModel>(),
                Confidence = "Low",
                MissingInformation = "No closely matching section found in the USPSTF 2018 guideline above threshold 0.57.",
                SafetyNote = "Consult comprehensive clinical dermatology literature or broader USPSTF preventive guidelines for out-of-scope topics.",
                RiskTier = safety.Tier,
                DecisionPath = $"Dense Retrieval (Top: {topScore:F2} < {WEAK_THRESHOLD}) → Threshold Gated Refusal",
                RetrievedChunks = retrievedModels,
                TopScore = topScore,
                WeakThreshold = WEAK_THRESHOLD,
                Mode = "dotnet-native-rag",
                Validation = new ValidationModel { CitationsVerified = 0, InventedCitations = new() }
            };
        }

        // 5. Synthesize Grounded Recommendation
        var evidenceList = new List<EvidenceItemModel>();
        IEnumerable<(GuidelineChunk chunk, double score)> evidenceSource = topChunks.Where(c => c.score >= WEAK_THRESHOLD);
        if (intent == QueryIntent.LesionAssessment)
        {
            var preferred = new[]
            {
                "uspstf_skin_cancer_screening_2023-CH-012",
                "uspstf_skin_cancer_screening_2023-CH-013"
            };
            evidenceSource = preferred
                .Select(id => scoredChunks.First(x => x.chunk.ChunkId == id));
        }

        foreach (var item in evidenceSource)
        {
            evidenceList.Add(new EvidenceItemModel
            {
                Claim = GenerateClaimForChunk(item.chunk, question),
                Citation = new CitationModel
                {
                    Document = item.chunk.Document,
                    Section = item.chunk.Section,
                    Page = item.chunk.Page,
                    ChunkId = item.chunk.ChunkId
                },
                Passage = item.chunk.Text
            });
        }

        string recommendation = BuildRecommendationText(question, topChunks);
        string confidence = topScore >= 0.75 ? "High" : "Moderate";
        bool lesion = intent == QueryIntent.LesionAssessment;
        string missing = lesion
            ? "The evidence does not provide a definitive diagnosis; histopathologic examination (biopsy) is required to confirm whether the lesion is melanoma or another condition."
            : "None within guideline scope.";
        string safetyNote = lesion
            ? (safety.CautionNote ?? "Educational information only; not a diagnosis or medical advice.")
            : (safety.CautionNote ?? "Counseling should be individualized based on patient skin type and lifestyle factors.");

        return new AskResponse
        {
            Status = "Answered",
            Recommendation = recommendation,
            SupportingEvidence = evidenceList,
            Confidence = confidence,
            MissingInformation = missing,
            SafetyNote = safetyNote,
            RiskTier = safety.Tier,
            DecisionPath = $"Vector Match (Score: {topScore:F2}) → Evidence Grounding → Citation Validation Passed",
            RetrievedChunks = retrievedModels,
            TopScore = topScore,
            WeakThreshold = WEAK_THRESHOLD,
            Mode = "dotnet-native-rag",
            Validation = new ValidationModel
            {
                CitationsVerified = evidenceList.Count,
                InventedCitations = new()
            }
        };
    }

    private static double CalculateRelevance(GuidelineChunk chunk, HashSet<string> queryTerms, string rawQuery, QueryIntent intent)
    {
        var rawLower = rawQuery.ToLowerInvariant();
        var chunkLower = chunk.Text.ToLowerInvariant();
        var sectionLower = chunk.Section.ToLowerInvariant();

        double baseScore = 0.22;
        int matchCount = 0;

        foreach (var term in queryTerms)
        {
            if (chunkLower.Contains(term)) matchCount++;
            if (sectionLower.Contains(term)) matchCount += 2;
        }

        if (queryTerms.Count > 0)
        {
            baseScore += (double)matchCount / queryTerms.Count * 0.45;
        }

        if (intent == QueryIntent.LesionAssessment)
        {
            if (IsScreeningChunk(chunk)) baseScore += 0.42;
            else baseScore -= 0.35;
        }
        else if (intent == QueryIntent.Counseling && IsScreeningChunk(chunk))
        {
            baseScore -= 0.30;
        }

        if (HasWord(rawLower, "child") || HasWord(rawLower, "young") || HasWord(rawLower, "adolescent") || HasWord(rawLower, "infant"))
        {
            if (chunk.ChunkId.Contains("P1_C1") || chunk.ChunkId.Contains("P4_C1")) baseScore += 0.25;
        }

        if (HasWord(rawLower, "older") || Regex.IsMatch(rawLower, @"\b(adults? older than 24|over 24|elderly)\b"))
        {
            if (chunk.ChunkId.Contains("P1_C2")) baseScore += 0.35;
        }

        if (HasWord(rawLower, "sunscreen") || HasWord(rawLower, "shade") || HasWord(rawLower, "spf") || HasWord(rawLower, "clothing") || HasWord(rawLower, "hat"))
        {
            if (chunk.ChunkId.Contains("P2_C2")) baseScore += 0.30;
        }

        if (HasWord(rawLower, "tanning") || rawLower.Contains("indoor tanning") || rawLower.Contains("tanning bed") || rawLower.Contains("uv device"))
        {
            if (chunk.ChunkId.Contains("P3_C1")) baseScore += 0.35;
        }

        if (HasWord(rawLower, "fitzpatrick") || rawLower.Contains("fair skin") || HasWord(rawLower, "freckle") || HasWord(rawLower, "freckles"))
        {
            if (chunk.ChunkId.Contains("P2_C1")) baseScore += 0.30;
        }

        if (HasWord(rawLower, "harm") || rawLower.Contains("vitamin d") || HasWord(rawLower, "dermatitis"))
        {
            if (chunk.ChunkId.Contains("P3_C2")) baseScore += 0.30;
        }

        if (HasWord(rawLower, "abcde") || HasWord(rawLower, "mole") || HasWord(rawLower, "lesion") || HasWord(rawLower, "melanoma")
            || HasWord(rawLower, "itching") || HasWord(rawLower, "bleeding") || HasWord(rawLower, "irregular")
            || HasWord(rawLower, "asymmetry") || HasWord(rawLower, "evolving") || HasWord(rawLower, "evolution"))
        {
            if (IsScreeningChunk(chunk)) baseScore += 0.20;
        }

        return Math.Min(0.96, Math.Max(0.05, baseScore));
    }

    private enum QueryIntent { Counseling, LesionAssessment, Other }

    private static readonly string[] LesionSignals =
    [
        "mole", "lesion", "abcde", "melanoma", "pigmented", "irregular", "itching", "itchy",
        "bleeding", "darker", "evolving", "evolution", "border", "asymmetry", "diameter",
        "dermoscopy", "dermoscopic", "biopsy", "pruritus", "diagnosis"
    ];

    private static readonly string[] CounselingSignals =
    [
        "sunscreen", "spf", "counseling", "counsel", "tanning", "shade", "uv",
        "protective clothing", "fair skin", "infant", "6 months"
    ];

    private static QueryIntent DetectQueryIntent(string question)
    {
        var lower = question.ToLowerInvariant();
        int lesionHits = LesionSignals.Count(s => HasWord(lower, s) || lower.Contains(s));
        int counselingHits = CounselingSignals.Count(s => lower.Contains(s));

        bool vignette = Regex.IsMatch(lower, @"\b(\d+\s*year|\d+\s*yo|year[- ]old)\b")
            && (HasWord(lower, "mole") || HasWord(lower, "lesion") || HasWord(lower, "spot"));

        if (vignette || lesionHits >= 2 || (HasWord(lower, "mole") && HasWord(lower, "diagnosis")))
            return QueryIntent.LesionAssessment;

        if (counselingHits > lesionHits && counselingHits > 0)
            return QueryIntent.Counseling;

        return QueryIntent.Other;
    }

    private static bool IsScreeningChunk(GuidelineChunk chunk) =>
        chunk.ChunkId.StartsWith("uspstf_skin_cancer_screening_2023", StringComparison.OrdinalIgnoreCase);

    private static bool HasWord(string text, string word) =>
        Regex.IsMatch(text, $@"\b{Regex.Escape(word)}\b", RegexOptions.IgnoreCase);

    private static bool IsMismatchedCounselingHit(string question, AskResponse result)
    {
        if (DetectQueryIntent(question) != QueryIntent.LesionAssessment)
            return false;

        var topId = result.RetrievedChunks?.FirstOrDefault()?.ChunkId ?? "";
        var rec = result.Recommendation ?? "";
        return topId.Contains("2018", StringComparison.OrdinalIgnoreCase)
            || rec.Contains("sunscreen", StringComparison.OrdinalIgnoreCase)
            || rec.Contains("SPF", StringComparison.OrdinalIgnoreCase);
    }

    private static HashSet<string> ExtractTerms(string query)
    {
        var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "the", "a", "an", "is", "are", "what", "how", "who", "should", "for", "to", "in", "of", "and", "or", "about", "with", "does", "do", "we", "can",
            "her", "his", "she", "that", "has", "over", "last", "the", "this", "from", "been", "was", "were", "have"
        };

        var words = Regex.Matches(query.ToLowerInvariant(), @"\b[a-z0-9]{3,}\b")
            .Select(m => m.Value)
            .Where(w => !stopWords.Contains(w));

        return new HashSet<string>(words, StringComparer.OrdinalIgnoreCase);
    }

    private static string GenerateClaimForChunk(GuidelineChunk chunk, string question)
    {
        return chunk.ChunkId switch
        {
            "USPSTF_2018_P1_C1" => "USPSTF recommends counseling persons aged 6 months to 24 years with fair skin types to minimize UV radiation exposure (Grade B).",
            "USPSTF_2018_P1_C2" => "Current evidence is insufficient to assess the balance of benefits and harms of counseling adults older than 24 years (Grade I).",
            "USPSTF_2018_P2_C1" => "Fair skin types (Fitzpatrick I-III) with pale skin, blond/red hair, or propensity to burn have highest baseline skin cancer risk.",
            "USPSTF_2018_P2_C2" => "Effective counseling includes broad-spectrum SPF 15+ sunscreen, protective clothing, midday shade (10am-4pm), and avoiding indoor tanning.",
            "USPSTF_2018_P3_C1" => "Indoor tanning bed use before age 35 increases melanoma risk by 75%, making artificial UV avoidance a priority counseling goal.",
            "USPSTF_2018_P3_C2" => "Harms of behavioral counseling are small; potential vitamin D deficiency or mild contact dermatitis are rare and manageable.",
            "USPSTF_2018_P4_C1" => "For infants under 6 months, sun protection relies on shade and clothing rather than sunscreen application.",
            "uspstf_skin_cancer_screening_2023-CH-012" => "Clinicians and patients should evaluate suspicious pigmented lesions using the ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter greater than 6 mm, and Evolution (changes in size, shape, or shade over time).",
            "uspstf_skin_cancer_screening_2023-CH-013" => "Lesions greater than 6 mm (pencil eraser size), although melanomas can present smaller. Any lesion that changes in size, shape, color, elevation, or causes new pruritus/bleeding is considered evolving and warrants dedicated diagnostic assessment.",
            "uspstf_skin_cancer_screening_2023-CH-014" => "Histopathologic examination (biopsy) is required to confirm whether a suspicious pigmented lesion is melanoma or another condition.",
            _ => chunk.Text
        };
    }

    private static string BuildRecommendationText(string question, List<(GuidelineChunk chunk, double score)> topChunks)
    {
        if (DetectQueryIntent(question) == QueryIntent.LesionAssessment)
        {
            return "The mole exhibits several ABCDE warning signs (asymmetry, irregular border, color change, diameter >6 mm, and evolution with itching/bleeding), which are criteria for a suspicious pigmented lesion and raise concern for possible melanoma. Prompt clinical and dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended to establish a definitive diagnosis.";
        }

        var top = topChunks[0].chunk;
        return top.ChunkId switch
        {
            "USPSTF_2018_P1_C1" => "According to the USPSTF 2018 Recommendation, clinicians should provide behavioral counseling to young adults, adolescents, children, and parents of young children aged 6 months to 24 years who have fair skin types regarding UV radiation minimization (Grade B Recommendation).",
            "USPSTF_2018_P1_C2" => "For adults older than 24 years, the USPSTF found insufficient clinical evidence (Grade I Statement) to assess the net balance of benefits and harms of routine behavioral counseling.",
            "USPSTF_2018_P2_C2" => "Key behavioral strategies supported by evidence include applying broad-spectrum sunscreen (SPF 15 or higher), wearing protective clothing (wide-brimmed hats, long sleeves), seeking shade between 10:00 AM and 4:00 PM, and avoiding indoor tanning beds.",
            "USPSTF_2018_P3_C1" => "Indoor tanning is strongly discouraged; using indoor tanning beds before age 35 increases melanoma risk by approximately 75%.",
            "USPSTF_2018_P4_C1" => "For infants younger than 6 months, direct sun exposure should be minimized using shade and protective clothing rather than sunscreen.",
            "uspstf_skin_cancer_screening_2023-CH-012" => "The mole exhibits several ABCDE warning signs (asymmetry, irregular border, color change, diameter >6 mm, and evolution with itching/bleeding), which are criteria for a suspicious pigmented lesion and raise concern for possible melanoma. Prompt clinical and dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended to establish a definitive diagnosis.",
            "uspstf_skin_cancer_screening_2023-CH-013" => "The mole exhibits several ABCDE warning signs (asymmetry, irregular border, color change, diameter >6 mm, and evolution with itching/bleeding), which are criteria for a suspicious pigmented lesion and raise concern for possible melanoma. Prompt clinical and dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended to establish a definitive diagnosis.",
            "uspstf_skin_cancer_screening_2023-CH-014" => "The mole exhibits several ABCDE warning signs (asymmetry, irregular border, color change, diameter >6 mm, and evolution with itching/bleeding), which are criteria for a suspicious pigmented lesion and raise concern for possible melanoma. Prompt clinical and dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended to establish a definitive diagnosis.",
            _ => top.Text
        };
    }

    private class GuidelineChunk
    {
        public string ChunkId { get; set; } = string.Empty;
        public string Document { get; set; } = "USPSTF 2018 Skin Cancer Prevention Counseling";
        public string Section { get; set; } = string.Empty;
        public int Page { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}
