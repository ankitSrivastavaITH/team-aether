"""PDF text extraction and AI-powered term extraction.
Uses PyPDF for text-based PDFs, falls back to unstructured (OCR) for scanned PDFs."""

import io
import json
from typing import Dict
from pypdf import PdfReader
from app.services.groq_client import chat
from app.services.vector_store import ingest_pdf_text
from app.services.extracted_store import store_extraction

EXTRACTION_PROMPT = """You are a government contract analysis assistant. Extract the following fields from the contract text.
Return ONLY valid JSON with these fields:
{
  "expiration_date": "date string or null",
  "renewal_option": "description of renewal terms or null",
  "pricing_structure": "description of pricing/payment terms or null",
  "key_conditions": ["list of important conditions or requirements"],
  "parties": ["list of party/organization names involved"],
  "contract_value": "dollar amount as string or null",
  "summary": "2-3 sentence plain-language summary of what this contract is about"
}
If a field cannot be determined from the text, set it to null.
Do not guess or fabricate information. Only extract what is clearly stated."""


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
