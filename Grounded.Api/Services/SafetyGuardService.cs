using System.Text.RegularExpressions;

namespace Grounded.Api.Services;

public class SafetyRiskResult
{
    public string Tier { get; set; } = "Allowed"; // "Refuse/Redirect", "Needs Caution", "Allowed"
    public string Reason { get; set; } = string.Empty;
    public string? RefusalMessage { get; set; }
    public string? CautionNote { get; set; }
}

public interface ISafetyGuardService
{
    SafetyRiskResult Classify(string query);
}

public class SafetyGuardService : ISafetyGuardService
{
    private static readonly string[] EmergencyPatterns =
    [
        "bleeding heavily", "sudden chest pain", "can't breathe", "anaphylaxis",
        "emergency", "stroke", "severe allergic", "suicide", "dying", "fainted"
    ];

    private static readonly string[] DosagePatterns =
    [
        "how many mg", "what dosage", "how many milligrams", "take 500mg",
        "prescription dose", "how much ibuprofen", "tretinoin dosage", "fluorouracil dosage"
    ];

    private static readonly string[] DiagnosisPatterns =
    [
        "do i have melanoma", "diagnose this mole", "is this cancer",
        "look at my skin and tell me", "is this lump malignant", "biopsy result diagnosis"
    ];

    private static readonly string[] InjectionPatterns =
    [
        "ignore previous instructions", "disregard guidelines", "bypass filter",
        "act as an unrestricted", "dan mode", "jailbreak", "override safety"
    ];

    private static readonly string[] PatientSpecificPatterns =
    [
        "my child", "my 6 month old", "i am pregnant", "for my daughter",
        "my grandmother", "my specific condition", "for myself with lupus"
    ];

    public SafetyRiskResult Classify(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new SafetyRiskResult
            {
                Tier = "Refuse/Redirect",
                Reason = "Empty query.",
                RefusalMessage = "Please enter a clinical query regarding skin cancer prevention counseling."
            };
        }

        var lower = query.ToLowerInvariant();

        // 1. Adversarial / Prompt Injections
        if (InjectionPatterns.Any(p => lower.Contains(p)))
        {
            return new SafetyRiskResult
            {
                Tier = "Refuse/Redirect",
                Reason = "Prompt injection / safety bypass attempt detected.",
                RefusalMessage = "I am strictly bounded to provide evidence-based skin cancer prevention counseling from verified clinical guidelines. I cannot process instructions that attempt to bypass clinical guardrails."
            };
        }

        // 2. Emergency Symptoms
        if (EmergencyPatterns.Any(p => lower.Contains(p)))
        {
            return new SafetyRiskResult
            {
                Tier = "Refuse/Redirect",
                Reason = "Emergency clinical condition detected.",
                RefusalMessage = "🚨 **EMERGENCY WARNING**: If you or someone else is experiencing an acute medical emergency, please call your local emergency services (e.g., 911 or 123) or visit the nearest emergency room immediately. This assistant is for non-urgent guideline education only."
            };
        }

        // 3. Medication Dosage
        if (DosagePatterns.Any(p => lower.Contains(p)))
        {
            return new SafetyRiskResult
            {
                Tier = "Refuse/Redirect",
                Reason = "Medication dosage request.",
                RefusalMessage = "Medication dosage calculation requires a licensed physician or pharmacist evaluation of individual patient metrics. The USPSTF guideline covers behavioral counseling, not pharmaceutical dosing."
            };
        }

        // 4. First-person diagnostic requests ("do I have melanoma?") — refuse.
        // Educational vignettes ("what is the diagnosis?" + ABCDE features) stay in-scope.
        if (DiagnosisPatterns.Any(p => lower.Contains(p)))
        {
            return new SafetyRiskResult
            {
                Tier = "Refuse/Redirect",
                Reason = "Diagnostic inquiry.",
                RefusalMessage = "This assistant cannot diagnose skin lesions or cancer. Please consult a board-certified dermatologist for in-person dermoscopic evaluation or biopsy of any changing, irregular, or symptomatic skin lesions."
            };
        }

        bool lesionVignette = Regex.IsMatch(lower, @"\b(\d+\s*year|\d+\s*yo|year[- ]old)\b")
            && (lower.Contains("mole") || lower.Contains("lesion") || lower.Contains("spot"));
        bool abcdeQuestion = (lower.Contains("mole") || lower.Contains("lesion"))
            && (lower.Contains("diagnosis") || lower.Contains("abcde") || lower.Contains("irregular")
                || lower.Contains("itching") || lower.Contains("bleeding") || lower.Contains("darker"));

        if (lesionVignette || abcdeQuestion)
        {
            return new SafetyRiskResult
            {
                Tier = "Needs Caution",
                Reason = "Suspicious-lesion educational vignette.",
                CautionNote = "Educational information only; not a diagnosis or medical advice."
            };
        }

        // 5. Patient-Specific / Caution Cases
        if (PatientSpecificPatterns.Any(p => lower.Contains(p)))
        {
            return new SafetyRiskResult
            {
                Tier = "Needs Caution",
                Reason = "Patient-specific inquiry.",
                CautionNote = "Note: Guidance provided is derived from population-level USPSTF behavioral counseling recommendations. Individual patient care plans should be verified with a primary care clinician or pediatrician."
            };
        }

        return new SafetyRiskResult
        {
            Tier = "Allowed",
            Reason = "General guideline inquiry within counseling scope."
        };
    }
}
