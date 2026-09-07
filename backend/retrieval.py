"""
Retrieval using similarity_search_with_relevance_scores.
Config A: top_k=5, weak_threshold=0.5.
Lesion vignettes are reranked toward ABCDE / screening chunks so counseling
passages (sunscreen, shade, tanning) cannot hijack diagnosis-style questions.
"""

from .index import get_vectorstore

TOP_K = 5
WEAK_THRESHOLD = 0.57

LESION_TERMS = {
    "mole", "lesion", "abcde", "melanoma", "pigmented", "irregular", "itching",
    "bleeding", "darker", "evolving", "evolution", "border", "asymmetry",
    "diameter", "diagnosis", "pruritus", "biopsy", "dermoscopy",
}

COUNSELING_NOISE = {
    "sunscreen", "spf", "tanning", "shade", "clothing", "hat", "infant",
}


def _is_lesion_query(question: str) -> bool:
    q = question.lower()
    hits = sum(1 for t in LESION_TERMS if t in q)
    vignette = ("year old" in q or "year-old" in q) and ("mole" in q or "lesion" in q)
    return vignette or hits >= 2 or ("mole" in q and "diagnosis" in q)


def _is_screening_chunk(chunk: dict) -> bool:
    cid = str(chunk.get("chunk_id", "")).lower()
    return "screening_2023" in cid or "abcde" in str(chunk.get("text", "")).lower()


def retrieve_final(question: str, k: int = TOP_K) -> list[dict]:
    """
    Retrieve top-k chunks with relevance scores.
    Returns list of dicts with document, section, page, chunk_id, score, text.
    """
    vs = get_vectorstore()
    search_q = question
    if _is_lesion_query(question):
        search_q = (
            question
            + " ABCDE suspicious pigmented lesion melanoma screening "
            + "evolution itching bleeding irregular border biopsy dermoscopy"
        )

    results = vs.similarity_search_with_relevance_scores(search_q, k=max(k, 8))

    chunks = []
    for doc, score in results:
        m = doc.metadata
        chunks.append({
            "document": m.get("document_name", "Unknown"),
            "section": m.get("section", "Unknown"),
            "page": m.get("page", m.get("page_number", 0)),
            "chunk_id": m.get("chunk_id", "unknown"),
            "score": round(float(score), 4),
            "text": doc.page_content,
        })

    if _is_lesion_query(question):
        for c in chunks:
            if _is_screening_chunk(c):
                c["score"] = round(min(0.96, c["score"] + 0.35), 4)
            elif any(term in c["text"].lower() for term in COUNSELING_NOISE):
                c["score"] = round(max(0.05, c["score"] - 0.40), 4)

    chunks.sort(key=lambda c: c["score"], reverse=True)
    return chunks[:k]
