"""
FastAPI app — wraps the grounded RAG pipeline.
POST /ask → full pipeline response.
GET /health → index + LLM mode status.
"""

import os
import traceback
from pathlib import Path

# Load .env file if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .index import build_index, get_vectorstore
from .retrieval import retrieve_final, WEAK_THRESHOLD, TOP_K
from .risk_classifier import classify_risk
from .generation import generate_grounded_answer
from .validation import validate_response

app = FastAPI(
    title="Grounded — Clinical Evidence API",
    description="Evidence-bound RAG pipeline for skin cancer prevention counseling",
    version="1.0.0",
)

# CORS for frontend (dev and deploy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",  # permissive for hackathon demo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State ──────────────────────────────────────────────────────────────────

_index_loaded = False
_index_chunk_count = 0


@app.on_event("startup")
async def startup_event():
    """Build or load the persisted Chroma index once on startup."""
    global _index_loaded, _index_chunk_count
    try:
        vs = build_index()
        _index_chunk_count = vs._collection.count()
        _index_loaded = True
        print(f"[startup] Index ready with {_index_chunk_count} chunks")
    except Exception as e:
        print(f"[startup] WARNING: Could not load index: {e}")
        _index_loaded = False


# ── Models ─────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class CitationModel(BaseModel):
    document: str
    section: str
    page: int
    chunk_id: str


class EvidenceItemModel(BaseModel):
    claim: str
    citation: CitationModel
    passage: str | None = None


class RetrievedChunkModel(BaseModel):
    document: str
    section: str
    page: int
    chunk_id: str
    score: float
    text: str


class ValidationModel(BaseModel):
    citations_verified: int
    invented_citations: list[str]


class AskResponse(BaseModel):
    status: str
    recommendation: str
    supporting_evidence: list[EvidenceItemModel]
    confidence: str
    missing_information: str
    safety_note: str
    risk_tier: str
    decision_path: str
    retrieved_chunks: list[RetrievedChunkModel]
    weak_threshold: float
    top_score: float
    mode: str
    validation: ValidationModel


class HealthResponse(BaseModel):
    status: str
    index_loaded: bool
    chunk_count: int
    llm_mode: str


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    mode = "live" if os.environ.get("OPEN_ROUTER_KEY") else "simulated"
    return HealthResponse(
        status="ok" if _index_loaded else "degraded",
        index_loaded=_index_loaded,
        chunk_count=_index_chunk_count,
        llm_mode=mode,
    )


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    """
    Full pipeline: classify → retrieve → threshold check → generate → validate.
    """
    try:
        question = req.question.strip()
        mode = "live" if os.environ.get("OPEN_ROUTER_KEY") else "simulated"

        # 1. Classify risk tier
        risk = classify_risk(question)

        if risk["tier"] == "Refuse/Redirect":
            return AskResponse(
                status="Safety Refusal",
                recommendation="This question is outside what this evidence-bound assistant will answer.",
                supporting_evidence=[],
                confidence="N/A",
                missing_information=risk["reason"],
                safety_note=(
                    "For urgent symptoms seek immediate medical care. "
                    "For prescribing or diagnostic questions, consult a licensed clinician."
                ),
                risk_tier=risk["tier"],
                decision_path="safety_refusal",
                retrieved_chunks=[],
                weak_threshold=WEAK_THRESHOLD,
                top_score=0,
                mode=mode,
                validation=ValidationModel(citations_verified=0, invented_citations=[]),
            )

        # 2. Retrieve
        chunks = retrieve_final(question, k=TOP_K)
        top_score = chunks[0]["score"] if chunks else 0

        # 3. Weak-retrieval gate
        if not chunks or top_score < WEAK_THRESHOLD:
            return AskResponse(
                status="Insufficient Evidence",
                recommendation=(
                    "The source guideline does not contain material that "
                    "supports an answer to this question."
                ),
                supporting_evidence=[],
                confidence="Insufficient Evidence",
                missing_information=(
                    f"Top retrieval similarity was {top_score:.3f}, below the "
                    f"weak-retrieval threshold of {WEAK_THRESHOLD}. The indexed "
                    f"source covers skin cancer prevention counseling only."
                ),
                safety_note=(
                    "Rephrase within skin cancer prevention counseling, or "
                    "consult a clinician / the appropriate guideline for this topic."
                ),
                risk_tier=risk["tier"],
                decision_path="weak_retrieval_refused",
                retrieved_chunks=[
                    RetrievedChunkModel(**c) for c in chunks
                ],
                weak_threshold=WEAK_THRESHOLD,
                top_score=top_score,
                mode=mode,
                validation=ValidationModel(citations_verified=0, invented_citations=[]),
            )

        # 4. Generate
        gen_response, gen_mode = generate_grounded_answer(question, chunks)

        # 5. Validate
        validation = validate_response(gen_response, chunks)

        # Filter out invented citations
        invented_set = set(validation["invented_citations"])
        clean_evidence = [
            item for item in gen_response.get("supporting_evidence", [])
            if item.get("citation", {}).get("chunk_id", "") not in invented_set
        ]

        # Safety note override for Needs Caution
        safety_note = gen_response.get("safety_note", "")
        if risk["tier"] == "Needs Caution":
            safety_note = (
                "This question appears patient-specific. The answer below is "
                "general guideline content and is not a diagnosis or personal "
                "medical advice."
            )

        return AskResponse(
            status=gen_response.get("status", "Answered"),
            recommendation=gen_response.get("recommendation", ""),
            supporting_evidence=[
                EvidenceItemModel(
                    claim=item["claim"],
                    citation=CitationModel(**item["citation"]),
                    passage=item.get("passage"),
                )
                for item in clean_evidence
            ],
            confidence=gen_response.get("confidence", "Low"),
            missing_information=gen_response.get("missing_information", ""),
            safety_note=safety_note,
            risk_tier=risk["tier"],
            decision_path="answered",
            retrieved_chunks=[
                RetrievedChunkModel(**c) for c in chunks
            ],
            weak_threshold=WEAK_THRESHOLD,
            top_score=top_score,
            mode=gen_mode,
            validation=ValidationModel(
                citations_verified=validation["citations_verified"],
                invented_citations=validation["invented_citations"],
            ),
        )

    except Exception as e:
        print(f"[/ask] Error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while processing your question. Please try again.",
        )
