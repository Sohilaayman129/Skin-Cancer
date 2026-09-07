"""
Response validation and invented-citation detection.
Ported from the Day 3 notebook's validate_response() and check_invented_citation().
"""


VALID_STATUSES = {"Answered", "Insufficient Evidence", "Safety Refusal"}
VALID_CONFIDENCE = {"High", "Medium", "Low", "Insufficient Evidence"}


def validate_response(response: dict, retrieved_chunks: list[dict]) -> dict:
    """
    Validate the structured response schema and check for invented citations.
    Returns {"valid": bool, "errors": [...], "citations_verified": int, "invented_citations": [...]}.
    """
    errors = []

    # Schema validation
    for field in [
        "status",
        "recommendation",
        "supporting_evidence",
        "confidence",
        "missing_information",
        "safety_note",
    ]:
        if field not in response:
            errors.append(f"missing required field: {field}")

    if errors:
        return {
            "valid": False,
            "errors": errors,
            "citations_verified": 0,
            "invented_citations": [],
        }

    if response["status"] not in VALID_STATUSES:
        errors.append(f"invalid status: {response['status']}")
    if response["confidence"] not in VALID_CONFIDENCE:
        errors.append(f"invalid confidence: {response['confidence']}")

    if response["status"] == "Answered":
        if not response["supporting_evidence"]:
            errors.append("status=Answered but supporting_evidence is empty")
        if response["confidence"] == "Insufficient Evidence":
            errors.append("status=Answered but confidence=Insufficient Evidence")

        for i, item in enumerate(response["supporting_evidence"]):
            if "claim" not in item or not item["claim"]:
                errors.append(f"supporting_evidence[{i}] missing a claim")
            citation = item.get("citation")
            if not citation:
                errors.append(f"supporting_evidence[{i}] missing a citation")
            else:
                for field in ["document", "section", "page", "chunk_id"]:
                    if not citation.get(field):
                        errors.append(
                            f"supporting_evidence[{i}] citation missing '{field}'"
                        )
    else:
        if response.get("supporting_evidence"):
            errors.append(
                f"status={response['status']} but supporting_evidence is non-empty"
            )
        if response.get("confidence") != "Insufficient Evidence":
            errors.append(
                f"status={response['status']} should carry confidence=Insufficient Evidence"
            )

    # Check for invented citations
    retrieved_ids = {c["chunk_id"] for c in retrieved_chunks}
    evidence_ids = [
        item.get("citation", {}).get("chunk_id", "")
        for item in response.get("supporting_evidence", [])
    ]
    invented = [cid for cid in evidence_ids if cid and cid not in retrieved_ids]

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "citations_verified": len(evidence_ids) - len(invented),
        "invented_citations": invented,
    }
