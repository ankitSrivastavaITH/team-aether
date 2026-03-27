"""Vector store for contract PDF chunks using ChromaDB."""

import chromadb
from pathlib import Path
import hashlib
import re
from typing import List, Dict, Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data"
CHROMA_DIR = DATA_DIR / "chroma_db"

_client = None
_collection = None

COLLECTION_NAME = "contract_pdfs"


def _get_collection():
    """Get or create the ChromaDB collection. Uses built-in default embedding function."""
    global _client, _collection
    if _collection is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks."""
    if not text or not text.strip():
        return []

    # Split by paragraphs first, then recombine
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current_chunk) + len(para) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            # Keep overlap from end of current chunk
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = overlap_text + " " + para
        else:
            current_chunk = (current_chunk + "\n\n" + para).strip()

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def ingest_pdf_text(text: str, filename: str, metadata: Optional[Dict] = None) -> int:
    """Chunk text from a PDF and store in ChromaDB. Returns number of chunks."""
    collection = _get_collection()
    chunks = chunk_text(text)

    if not chunks:
        return 0

    ids = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        chunk_id = hashlib.md5(f"{filename}:{i}".encode()).hexdigest()
        ids.append(chunk_id)
        documents.append(chunk)
        chunk_meta = {
            "filename": filename,
            "chunk_index": i,
            "total_chunks": len(chunks),
        }
        if metadata:
            chunk_meta.update({k: str(v) for k, v in metadata.items() if v is not None})
        metadatas.append(chunk_meta)

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    return len(chunks)


def search_contracts(query: str, n_results: int = 5, filename_filter: Optional[str] = None) -> List[Dict]:
    """Search across all ingested contract PDFs."""
    collection = _get_collection()

    if collection.count() == 0:
        return []

    where = None
    if filename_filter:
        where = {"filename": filename_filter}

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        where=where,
    )

    matches = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            match = {
                "text": doc,
                "score": 1 - results["distances"][0][i] if results["distances"] else None,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
            }
            matches.append(match)

    return matches


def list_ingested_files() -> List[Dict]:
    """List all files that have been ingested."""
    collection = _get_collection()
    if collection.count() == 0:
        return []

    all_data = collection.get(include=["metadatas"])
    files = {}
    for meta in all_data["metadatas"]:
        fname = meta.get("filename", "unknown")
        if fname not in files:
            files[fname] = {"filename": fname, "chunks": 0}
        files[fname]["chunks"] += 1

    return list(files.values())
