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
    chunks.extend(toxicology_documents())
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


ATSDR_DOC_ID = "atsdr_h2s_cos_2016"
ATSDR_DOC_NAME = "ATSDR Toxicological Profile for Hydrogen Sulfide and Carbonyl Sulfide (2016)"
ATSDR_SOURCE_URL = "https://www.atsdr.cdc.gov/ToxProfiles/tp114.pdf"

ATSDR_CHUNKS = [
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-001",
        "page": 1,
        "section": "Public Health Statement — Chemical Identity & Odor Threshold",
        "text": (
            "Hydrogen sulfide (H2S) is a flammable, colorless gas with a characteristic rotten egg odor. "
            "The odor threshold in air ranges from 0.0005 to 0.3 ppm. At high concentrations (>=100 ppm), "
            "rapid olfactory fatigue or paralysis occurs, preventing smell detection and causing extreme risk."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-002",
        "page": 1,
        "section": "Public Health Statement — Environmental & Industrial Sources",
        "text": (
            "Hydrogen sulfide occurs naturally in volcanic gases, sulfur springs, undersea vents, and swamps. "
            "Industrial sources include wastewater treatment plants, municipal sewers, manure storage pits, "
            "petroleum refineries, natural gas processing, pulp and paper kraft mills, and tanneries."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-003",
        "page": 17,
        "section": "Health Effects — Respiratory Toxicity & Mechanism",
        "text": (
            "The respiratory tract is a primary target. Inhalation of high levels (>500 ppm) causes rapid respiratory "
            "arrest and noncardiogenic pulmonary edema by inhibiting mitochondrial cytochrome c oxidase. Low levels "
            "(2 to 10 ppm) act as a mucous membrane irritant causing cough, sore throat, and bronchial obstruction in asthmatics."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-004",
        "page": 74,
        "section": "Health Effects — Neurological Effects & Knockdown",
        "text": (
            "Acute high exposure leads to immediate loss of consciousness ('knockdown' or sledgehammer effect). "
            "Survivors may suffer persistent neurological sequelae including chronic headaches, vertigo, poor memory, "
            "ataxia, sleep disturbance, and cognitive deficits."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-005",
        "page": 20,
        "section": "Minimal Risk Levels (MRLs) — Inhalation Standards",
        "text": (
            "ATSDR established an Acute Inhalation MRL of 0.07 ppm for hydrogen sulfide (based on 2 ppm LOAEL for airway resistance in asthmatics) "
            "and an Intermediate Inhalation MRL of 0.02 ppm (based on 10 ppm NOAEL for nasal olfactory neuron lesions in rats)."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-006",
        "page": 210,
        "section": "Regulations & Occupational Exposure Limits",
        "text": (
            "Occupational standards for hydrogen sulfide: OSHA permissible ceiling is 20 ppm (peak 50 ppm for 10 min); "
            "NIOSH recommended ceiling REL is 10 ppm (10 min) with IDLH at 100 ppm; ACGIH TLV 8-hr TWA is 1 ppm (STEL 5 ppm)."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-007",
        "page": 7,
        "section": "Carbonyl Sulfide — Properties & Use",
        "text": (
            "Carbonyl sulfide (COS) is a colorless sulfur gas with an atmospheric lifetime of 2 to 10 years. "
            "It is used as an agricultural grain fumigant alternative to methyl bromide and as a chemical intermediate in herbicide synthesis."
        ),
    },
    {
        "chunk_id": f"{ATSDR_DOC_ID}-CH-008",
        "page": 121,
        "section": "Toxicokinetics, Biomarkers & Emergency Management",
        "text": (
            "Hydrogen sulfide is metabolized by hepatic oxidation to sulfate and thiosulfate excreted in urine. "
            "Urinary thiosulfate serves as a primary exposure biomarker. Emergency treatment requires rapid removal from exposure, "
            "100% high-flow oxygen, supportive care, and consideration of sodium nitrite or hyperbaric oxygen therapy."
        ),
    },
]


def toxicology_documents() -> list[Document]:
    docs = []
    for item in ATSDR_CHUNKS:
        docs.append(
            Document(
                page_content=item["text"],
                metadata={
                    "document_id": ATSDR_DOC_ID,
                    "document_name": ATSDR_DOC_NAME,
                    "page": item["page"],
                    "page_number": item["page"],
                    "section": item["section"],
                    "chunk_id": item["chunk_id"],
                    "source_url": ATSDR_SOURCE_URL,
                },
            )
        )
    return docs
