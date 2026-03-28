"""PDF text extraction and AI-powered term extraction.
Uses PyPDF for text-based PDFs, falls back to unstructured (OCR) for scanned PDFs."""

import io
import json
from typing import Dict
from pypdf import PdfReader
from app.services.groq_client import chat
from app.services.vector_store import ingest_pdf_text
from app.services.extracted_store import store_extraction

EXTRACTION_PROMPT = """You are a senior City of Richmond procurement analyst extracting key details from a government contract document.

IMPORTANT: Skip boilerplate legal language. Find the SPECIFIC contract details a procurement officer needs to make a renewal/rebid decision.

Return ONLY valid JSON:
{
  "contract_number": "the contract/solicitation number (e.g., '21000000131') or null",
  "contract_type": "IFB, RFP, RFQ, Cooperative, Sole Source, or other — the procurement method",
  "vendor_name": "the awarded contractor/vendor company name",
  "department": "the City department managing this contract",
  "contract_value": "the MAXIMUM authorized dollar amount (look for 'not to exceed', 'maximum authorized', 'total bid price')",
  "commencement_date": "when the contract starts (look for 'commencement date', 'effective date')",
  "expiration_date": "when the contract ends (look for 'expiration', 'completion date', 'performance time')",
  "performance_period": "duration in days/months/years (e.g., '365 consecutive calendar days', '24 months')",
  "renewal_option": "renewal terms (e.g., '3 one-year renewals', 'may be extended') or null if none",
  "total_possible_term": "original term + all renewals (e.g., '5 years total') or null",
  "pricing_structure": "how payment works (fixed price, unit rates, hourly, GMP, cost-plus)",
  "scope_of_work": "1-2 sentences describing WHAT the vendor will do (not legal terms)",
  "mbe_requirement": "MBE/DBE participation requirement percentage or null",
  "insurance_requirement": "required insurance types and amounts, or null",
  "bonding_requirement": "performance/payment bond requirements or null",
  "liquidated_damages": "penalty amount per day for late completion or null",
  "parties": ["City of Richmond", "vendor name", "any subcontractors mentioned"],
  "key_risks": ["list 2-3 specific risks a procurement officer should know about"],
  "summary": "3-4 sentence plain-language summary: what is being purchased, from whom, for how much, for how long, and any notable conditions"
}

Rules:
- Find ACTUAL dollar amounts, dates, and vendor names — not generic legal language
- For contract_value, look for the highest authorized amount (often in the contract header or award section)
- For dates, look in the contract execution section, not the solicitation section
- key_risks should be specific (e.g., "single source vendor", "no renewal option", "liquidated damages $2500/day")
- If a field truly cannot be found, set to null — but TRY to find it"""


def _extract_with_pypdf(file_bytes) -> str:
    """Extract text from a text-based PDF using PyPDF."""
    if isinstance(file_bytes, bytes):
        file_bytes = io.BytesIO(file_bytes)
    reader = PdfReader(file_bytes)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n\n"
    return text.strip()


def _extract_with_unstructured(file_bytes) -> str:
    """Extract text from scanned/image PDFs using unstructured (OCR)."""
    try:
        from unstructured.partition.pdf import partition_pdf
    except ImportError:
        return ""

    if isinstance(file_bytes, io.BytesIO):
        file_bytes.seek(0)
        raw = file_bytes.read()
    elif isinstance(file_bytes, bytes):
        raw = file_bytes
    else:
        return ""

    try:
        elements = partition_pdf(file=io.BytesIO(raw))
        extracted = "\n\n".join(str(el) for el in elements if str(el).strip())
        return extracted.strip()
    except Exception:
        return ""


def extract_text_from_pdf(file_bytes) -> str:
    """Extract text from PDF — tries PyPDF first, falls back to unstructured OCR."""
    # Try fast text extraction first
    text = _extract_with_pypdf(file_bytes)

    # If PyPDF got very little text, try OCR via unstructured
    if len(text) < 100:
        ocr_text = _extract_with_unstructured(file_bytes)
        if len(ocr_text) > len(text):
            text = ocr_text

    return text


def extract_contract_terms(pdf_bytes: bytes, filename: str = "uploaded.pdf") -> Dict:
    """Extract text from PDF, store in vector DB, and extract key terms via AI."""
    # Step 1: Extract text
    if isinstance(pdf_bytes, (bytes, bytearray)):
        text = extract_text_from_pdf(io.BytesIO(pdf_bytes))
    else:
        text = extract_text_from_pdf(pdf_bytes)

    if not text.strip():
        return {"error": "Could not extract text from PDF. Install 'unstructured[pdf]' for OCR support on scanned documents."}

    # Step 2: Store chunks in ChromaDB for later search
    chunk_count = ingest_pdf_text(text, filename)

    # Step 3: AI extraction of key terms (use first 8000 chars to fit in context)
    truncated = text[:8000]
    raw = chat(EXTRACTION_PROMPT, f"Contract text:\n\n{truncated}")

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        extraction = json.loads(cleaned.strip())
    except (json.JSONDecodeError, IndexError):
        extraction = {"error": "Failed to parse AI extraction", "raw_response": raw[:500]}

    # Store in DuckDB if extraction succeeded (no error key)
    record_id = None
    if "error" not in extraction:
        record_id = store_extraction(filename, extraction)
        extraction["record_id"] = record_id

    return {
        "text_length": len(text),
        "chunks_stored": chunk_count,
        "extraction": extraction,
    }
