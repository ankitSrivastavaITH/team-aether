"""PDF extraction and contract search endpoints."""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query
from app.services.pdf_extractor import extract_contract_terms
from app.services.vector_store import search_contracts, list_ingested_files

router = APIRouter(prefix="/api/extract", tags=["extract"])


@router.post("")
async def extract_pdf(file: UploadFile = File(...)):
    """Upload a contract PDF, extract text, store in vector DB, and extract key terms."""
    contents = await file.read()
    result = extract_contract_terms(contents, filename=file.filename or "uploaded.pdf")
    return {
        "filename": file.filename,
        "text_length": result.get("text_length", 0),
        "chunks_stored": result.get("chunks_stored", 0),
        "extraction": result.get("extraction", {}),
        "disclaimer": "AI-assisted extraction — verify against original document",
    }


@router.get("/search")
def search_pdfs(
    q: str = Query(..., description="Search query"),
    n: int = Query(default=5, ge=1, le=20),
    filename: Optional[str] = None,
):
    """Search across all ingested contract PDFs using semantic search."""
    results = search_contracts(q, n_results=n, filename_filter=filename)
    return {
        "query": q,
        "results": results,
        "total": len(results),
        "disclaimer": "Results are from AI-processed documents — verify against originals",
    }


@router.get("/files")
def get_ingested_files():
    """List all PDF files that have been ingested into the vector store."""
    return {"files": list_ingested_files()}
