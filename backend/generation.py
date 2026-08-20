"""
Grounded generation module.
DAY3_SYSTEM_PROMPT, format_citation, build_context, generate_grounded_answer,
and the _simulate_llm_response fallback.
Ported directly from the Day 3 notebook.
"""

import json
import os
from typing import Any

DAY3_SYSTEM_PROMPT = """You are an evidence-grounded clinical decision-support assistant
for skin cancer prevention counseling AND suspicious pigmented-lesion risk assessment
using USPSTF guideline text. You are not a general medical advisor and you do not diagnose patients.

RULES - follow every one exactly:
1. Use ONLY the retrieved evidence passages provided below. Never use outside medical
   knowledge, training data, or personal opinion.
2. Never invent missing thresholds, numbers, criteria, or citations. If the evidence
   doesn't state it, do not state it either.
3. Every claim in "supporting_evidence" must be paired with a citation that points to one
   of the retrieved chunks below - document, section, page, and chunk ID, exactly as given.
4. Match the question to the RIGHT guideline topic:
   - UV counseling, sunscreen, shade, clothing, tanning, infants, age groups → prevention counseling evidence.
   - Changing moles, ABCDE features, itching/bleeding lesions, "what is the diagnosis" vignettes
     → screening / ABCDE / biopsy evidence ONLY. Never answer those questions with sunscreen
     or behavioral-counseling passages even if they were retrieved.
5. For suspicious-lesion questions: summarize ABCDE warning signs present in the vignette,
   say they raise concern for possible melanoma, recommend prompt dermatologic evaluation
   (dermoscopy +/- biopsy), and do NOT give a definitive diagnosis.
6. Answer the question using whatever relevant information the evidence contains. Only set
   status to "Insufficient Evidence" when the retrieved passages have NO relevant content
   for the question at all. If the evidence partially answers the question, answer with
   what it supports and set confidence to "Low" or "Medium" as appropriate. Use
   "missing_information" to explain what aspects are not covered. For lesion vignettes,
   missing_information MUST note that biopsy/histopathology is required for a definitive diagnosis.
7. Return JSON matching exactly this structure:
   {
      "status": "Answered" | "Insufficient Evidence" | "Safety Refusal",
      "recommendation": "...",
      "supporting_evidence": [
         {"claim": "...", "citation": {"document": "...", "section": "...", "page": N, "chunk_id": "..."}}
      ],
      "confidence": "High" | "Medium" | "Low" | "Insufficient Evidence",
      "missing_information": "...",
      "safety_note": "Educational information only; not a diagnosis or medical advice."
   }
8. Never guess a dosage, threshold, or personalized recommendation. Partial answers are
   better than refusing - just mark them with appropriate confidence.
9. Respond with the JSON object only - no preamble, no markdown fences, nothing else.
"""


def format_citation(meta: dict) -> str:
    return (
        f"[{meta.get('document_name', meta.get('document', ''))} | "
        f"Section: {meta.get('section', '')} "
        f"| Page {meta.get('page', '')} "
        f"| Chunk: {meta.get('chunk_id', '')}]"
    )


def build_context(chunks: list[dict]) -> str:
    """Build the evidence context block for the LLM prompt."""
    blocks = []
    for c in chunks:
        citation = format_citation(c)
        blocks.append(
            f"EVIDENCE {citation} (similarity={c['score']:.4f})\n"
            f"{c['text']}"
        )
    return "\n\n".join(blocks)


def _simulate_llm_response(question: str, chunks: list[dict]) -> dict:
    """
    Fallback when no API key is set.
    Returns a structured response using the top retrieved chunks.
    """
    top = chunks[0]
    confidence = (
        "High" if top["score"] >= 0.6
        else "Medium" if top["score"] >= 0.45
        else "Low"
    )

    # Build supporting evidence from top 3 chunks
    evidence = []
    for c in chunks[:3]:
        # Extract first sentence as claim
        text = c["text"]
        dot_pos = text.find(".")
        claim = (text[:dot_pos + 1] if dot_pos > 0 else text).strip()
        evidence.append({
            "claim": claim,
            "citation": {
                "document": c["document"],
                "section": c["section"],
                "page": c["page"],
                "chunk_id": c["chunk_id"],
            },
            "passage": c["text"],
        })

    return {
        "status": "Answered",
        "recommendation": (
            f'Based on the retrieved guideline text, the response to '
            f'"{question.strip()}" is grounded in {top["section"]} '
            f'(page {top["page"]}): {evidence[0]["claim"]}'
        ),
        "supporting_evidence": evidence,
        "confidence": confidence,
        "missing_information": (
            ""
            if confidence == "High"
            else "Retrieval confidence is not high; verify against the full guideline text before clinical use."
        ),
        "safety_note": "This summarizes guideline text only. It does not account for individual patient factors.",
    }


def _parse_llm_json(raw_text: str) -> dict:
    """Parse JSON from LLM response, handling markdown fences and surrounding text."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()
    
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # Try finding JSON block between { and }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start : end + 1])
    
    return json.loads(text)


def generate_grounded_answer(
    question: str,
    chunks: list[dict],
) -> tuple[dict, str]:
    """
    Generate a grounded answer using the LLM or simulation fallback.
    Returns (response_dict, mode) where mode is "live" or "simulated".
    """
    api_key = os.environ.get("OPEN_ROUTER_KEY", "")

    if api_key:
        try:
            from langchain_openai import ChatOpenAI

            model_name = os.environ.get("OPEN_ROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")
            llm = ChatOpenAI(
                model=model_name,
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
                temperature=0,
                max_tokens=2048,
                request_timeout=25,
                default_headers={
                    "HTTP-Referer": "http://localhost:8080",
                    "X-Title": "Grounded Clinical Assistant",
                },
            )

            context = build_context(chunks)
            prompt = (
                f"{DAY3_SYSTEM_PROMPT}\n\n"
                f"Retrieved evidence:\n{context}\n\n"
                f"Question: {question}\n\n"
                "Respond with the JSON object only."
            )

            raw = llm.invoke(prompt).content
            response = _parse_llm_json(raw)

            # Attach passages from retrieved chunks to evidence items
            chunk_map = {c["chunk_id"]: c["text"] for c in chunks}
            for item in response.get("supporting_evidence", []):
                cid = item.get("citation", {}).get("chunk_id", "")
                if cid in chunk_map:
                    item["passage"] = chunk_map[cid]

            return response, "live"

        except Exception as e:
            print(f"[generation] LLM call failed, falling back to simulation: {e}")
            return _simulate_llm_response(question, chunks), "simulated"
    else:
        return _simulate_llm_response(question, chunks), "simulated"
