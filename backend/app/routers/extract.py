"""PDF extraction and contract search endpoints."""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query
from app.services.pdf_extractor import extract_contract_terms
from app.services.vector_store import search_contracts, list_ingested_files
from app.services.extracted_store import list_extractions

router = APIRouter(prefix="/api/extract", tags=["extract"])


@router.post("")
async def extract_pdf(file: UploadFile = File(...)):
    """Upload a contract PDF, extract text, store in vector DB, and extract key terms."""
    import os
    from pathlib import Path

    contents = await file.read()
    filename = file.filename or "uploaded.pdf"

    # Save the uploaded PDF so it can be viewed later
    upload_dir = Path(__file__).parent.parent.parent / "data" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(contents)

    result = extract_contract_terms(contents, filename=filename)
    return {
        "filename": filename,
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


@router.get("/extracted")
def get_extracted_contracts():
    """List all AI-extracted contract records."""
    return {"contracts": list_extractions()}


@router.get("/pdf/{filename}")
def serve_pdf(filename: str):
    """Serve a stored PDF file for viewing."""
    import os
    from fastapi.responses import FileResponse
    
    # Check sample PDFs first, then uploaded PDFs
    sample_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_pdfs")
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads")
    
    for directory in [sample_dir, upload_dir]:
        filepath = os.path.join(directory, filename)
        if os.path.exists(filepath) and filename.endswith(".pdf"):
            return FileResponse(filepath, media_type="application/pdf", filename=filename)
    
    return {"error": "PDF not found"}
