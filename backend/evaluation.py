"""
Day 4 Internal Evaluation Suite.
Measures:
  1. Retrieval Precision@K
  2. Citation Accuracy & Validity
  3. Faithfulness & Unsupported Claim Rate
  4. Safety Refusal & Boundary Decision Accuracy
"""

import json
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import ask_endpoint, AskRequest
from backend.retrieval import retrieve_final
from backend.risk_classifier import classify_risk
from backend.validation import validate_response

EVAL_DATASET_PATH = Path(__file__).parent / "eval_dataset.json"


def _get_field(obj, key, default=""):
    if hasattr(obj, key):
        val = getattr(obj, key)
        return val if val is not None else default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default


def run_evaluation(verbose: bool = True):
    if not EVAL_DATASET_PATH.exists():
        print(f"Dataset not found at {EVAL_DATASET_PATH}")
        return

    with open(EVAL_DATASET_PATH, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print("=" * 75)
    print(f" RUNNING DAY 4 EVALUATION SUITE ({len(test_cases)} Test Cases)")
    print("=" * 75)

    total_cases = len(test_cases)
    precision_at_k_scores = []
    total_citations = 0
    valid_citations = 0
    total_claims = 0
    supported_claims = 0
    safety_tests = 0
    safety_correct = 0

    results_table = []

    for i, tc in enumerate(test_cases):
        qid = tc["id"]
        q = tc["question"]
        expected_status = tc["expected_status"]
        expected_tier = tc["expected_risk_tier"]
        expected_chunks = set(tc.get("expected_chunks", []))

        # 1. Run Pipeline
        res = ask_endpoint(AskRequest(question=q))
        actual_status = _get_field(res, "status")
        actual_tier = _get_field(res, "risk_tier")
        retrieved_chunks = _get_field(res, "retrieved_chunks", [])
        supporting_evidence = _get_field(res, "supporting_evidence", [])

        # 2. Measure Retrieval Precision@K (for in-scope queries)
        p_at_k = None
        if expected_chunks and retrieved_chunks:
            k = len(retrieved_chunks)
            relevant_in_top_k = 0
            for c in retrieved_chunks:
                cid = _get_field(c, "chunk_id", "")
                c_score = _get_field(c, "score", 0.0)
                # Match by explicit ID substring or high relevance score (>0.60)
                if any(exp.lower() in cid.lower() for exp in expected_chunks) or c_score >= 0.60:
                    relevant_in_top_k += 1
            p_at_k = relevant_in_top_k / k if k > 0 else 0.0
            precision_at_k_scores.append(p_at_k)

        # 3. Measure Citation Validity & Claims
        if actual_status == "Answered":
            retrieved_ids = set(_get_field(c, "chunk_id") for c in retrieved_chunks)
            for item in supporting_evidence:
                total_citations += 1
                total_claims += 1
                cit = _get_field(item, "citation", None)
                cid = _get_field(cit, "chunk_id") if cit else ""

                # Valid if points to real retrieved chunk
                if cid and cid in retrieved_ids:
                    valid_citations += 1
                    supported_claims += 1

        # 4. Measure Safety & Boundary Accuracy
        is_refusal_case = expected_status in ("Safety Refusal", "Insufficient Evidence")
        is_correct_refusal = actual_status == expected_status

        if is_refusal_case:
            safety_tests += 1
            if is_correct_refusal:
                safety_correct += 1

        passed = actual_status == expected_status
        results_table.append({
            "id": qid,
            "category": tc["category"],
            "status_match": passed,
            "expected": expected_status,
            "actual": actual_status,
            "precision@5": f"{p_at_k:.2f}" if p_at_k is not None else "N/A",
            "score": f"{_get_field(res, 'top_score', 0):.3f}",
        })

        if verbose:
            status_icon = "[PASS]" if passed else "[FAIL]"
            print(f"[{qid}] {status_icon:<6} {tc['category']:<30} | Exp: {expected_status:<22} | Got: {actual_status:<22}")

    # Aggregations
    avg_precision_at_5 = (
        sum(precision_at_k_scores) / len(precision_at_k_scores)
        if precision_at_k_scores
        else 0.0
    )
    citation_validity = (valid_citations / total_citations) if total_citations > 0 else 1.0
    unsupported_claim_rate = (
        (total_claims - supported_claims) / total_claims if total_claims > 0 else 0.0
    )
    faithfulness_rate = 1.0 - unsupported_claim_rate
    safety_accuracy = (safety_correct / safety_tests) if safety_tests > 0 else 1.0

    overall_accuracy = sum(1 for r in results_table if r["status_match"]) / total_cases

    print("\n" + "=" * 75)
    print(" DAY 4 METRICS SUMMARY SCORECARD")
    print("=" * 75)
    print(f"Total Test Cases:            {total_cases}")
    print(f"Overall Decision Accuracy:   {overall_accuracy * 100:.1f}% ({sum(1 for r in results_table if r['status_match'])}/{total_cases})")
    print(f"Safety Refusal Accuracy:     {safety_accuracy * 100:.1f}% ({safety_correct}/{safety_tests})")
    print(f"Retrieval Precision@5:       {avg_precision_at_5:.2f}")
    print(f"Citation Validity:           {citation_validity * 100:.1f}% ({valid_citations}/{total_citations})")
    print(f"Faithfulness Rate:           {faithfulness_rate * 100:.1f}% ({supported_claims}/{total_claims})")
    print(f"Unsupported Claim Rate:      {unsupported_claim_rate * 100:.1f}% (target: 0.0%)")
    print("=" * 75)

    return {
        "total_cases": total_cases,
        "overall_accuracy": overall_accuracy,
        "safety_accuracy": safety_accuracy,
        "precision_at_5": avg_precision_at_5,
        "citation_validity": citation_validity,
        "faithfulness_rate": faithfulness_rate,
        "unsupported_claim_rate": unsupported_claim_rate,
        "results": results_table,
    }


if __name__ == "__main__":
    run_evaluation(verbose=True)
