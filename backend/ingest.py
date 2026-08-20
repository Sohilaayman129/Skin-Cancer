"""
PDF loading, cleaning, and chunking.
Config A: chunk_size=500, overlap=75 (selected after Day 2 evaluation).
Ported exactly from T1_Day3_OpenRouter_Free notebook.
"""

import os
import re
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

DOC_ID = "uspstf_skin_cancer_2018"
DOC_NAME = "Behavioral Counseling to Prevent Skin Cancer - Recommendation Statement"
SOURCE_URL = "https://www.uspreventiveservicestaskforce.org"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 75
REF_START_PAGE = 7  # 0-indexed: removes pages >= 7 (references section)

PAGE_SECTION_MAP = {
    1: "Abstract & Recommendation Summary",
    2: "Summary of Recommendations and Evidence",
    3: "Rationale - Benefits, Harms, and Clinical Considerations",
    4: "Clinical Considerations - Risk Assessment and Counseling",
    5: "Implementation and Research Needs",
    6: "Discussion - Evidence on Behavior Change and Cancer Risk",
    7: "Discussion - Net Benefit and Recommendation Update",
}

PDF_PATH = Path(__file__).resolve().parent.parent / "skin-cancer-counseling-final-recommendation.pdf"


def clean_text(text: str) -> str:
    """Clean text exactly as in notebook Cell 1."""
    if not text:
        return ""
    text = re.sub(r"-\s*\n\s*", "", text)
    text = re.sub(r"[\n\r\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"[^\x20-\x7E]", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def load_and_chunk(pdf_path: Path | None = None) -> list[Document]:
    """
    Load the PDF, clean it, filter reference pages, and chunk using Config A (500/75).
    Always append USPSTF 2023 screening / ABCDE passages so lesion questions are grounded.
    """
    path = pdf_path or PDF_PATH
    chunks: list[Document] = []

    if path.exists():
        loader = PyPDFLoader(str(path))
        raw_pages = loader.load()

        cleaned_pages = []
        for p in raw_pages:
            txt = clean_text(p.page_content)
            if txt:
                cleaned_pages.append(Document(page_content=txt, metadata=p.metadata))

        # Strip reference pages (page 7+ in 0-indexed PyPDF)
        clinical_pages = [d for d in cleaned_pages if d.metadata.get("page", 0) < REF_START_PAGE]

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", "; ", " ", ""],
        )
        chunks = splitter.split_documents(clinical_pages)

        for i, chunk in enumerate(chunks):
            page = chunk.metadata.get("page", None)
            page_num = (page + 1) if page is not None else 1
            chunk_id_str = f"{DOC_ID}-CH-{i+1:03d}"

            chunk.metadata["document_id"] = DOC_ID
            chunk.metadata["document_name"] = DOC_NAME
            chunk.metadata["page"] = page_num
            chunk.metadata["page_number"] = page_num
            chunk.metadata["section"] = PAGE_SECTION_MAP.get(page_num, "Unclassified")
            chunk.metadata["chunk_id"] = chunk_id_str
            chunk.metadata["source_url"] = SOURCE_URL
            chunk.metadata.pop("source", None)
    else:
        print(f"[ingest] Counseling PDF not found at {path}; indexing screening passages only.")

    chunks.extend(screening_documents())
    return chunks


SCREENING_DOC_ID = "uspstf_skin_cancer_screening_2023"
SCREENING_DOC_NAME = "USPSTF Skin Cancer Screening (2023)"
SCREENING_SECTION = "Clinical Considerations - Risk Assessment & High-Risk Groups"

SCREENING_CHUNKS = [
    {
        "chunk_id": f"{SCREENING_DOC_ID}-CH-012",
        "page": 4,
        "section": SCREENING_SECTION,
        "text": (
            "Clinicians and patients should evaluate suspicious pigmented lesions using the ABCDE rule: "
            "Asymmetry, Border irregularity, Color variation, Diameter greater than 6 mm, and Evolution "
            "(changes in size, shape, or shade over time)."
        ),
    },
    {
        "chunk_id": f"{SCREENING_DOC_ID}-CH-013",
        "page": 4,
        "section": SCREENING_SECTION,
        "text": (
            "Lesions greater than 6 mm (pencil eraser size), although melanomas can present smaller. "
            "Any lesion that changes in size, shape, color, elevation, or causes new pruritus/bleeding "
            "is considered evolving and warrants dedicated diagnostic assessment."
        ),
    },
    {
        "chunk_id": f"{SCREENING_DOC_ID}-CH-014",
        "page": 4,
        "section": "Clinical Considerations - Diagnostic Evaluation",
        "text": (
            "The evidence does not provide a definitive clinical diagnosis of melanoma from history or "
            "visual features alone. Histopathologic examination (biopsy) is required to confirm whether "
            "a suspicious pigmented lesion is melanoma or another condition. Prompt clinical and "
            "dermatologic evaluation, including dermoscopic examination and possible biopsy, is recommended."
        ),
    },
]


def screening_documents() -> list[Document]:
    docs = []
    for item in SCREENING_CHUNKS:
        docs.append(
            Document(
                page_content=item["text"],
                metadata={
                    "document_id": SCREENING_DOC_ID,
                    "document_name": SCREENING_DOC_NAME,
                    "page": item["page"],
                    "page_number": item["page"],
                    "section": item["section"],
                    "chunk_id": item["chunk_id"],
                    "source_url": SOURCE_URL,
                },
            )
        )
    return docs
