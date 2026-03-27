"""Store AI-extracted contract data in DuckDB for unified querying."""

import duckdb
from pathlib import Path
from typing import Dict
from datetime import datetime

DB_PATH = Path(__file__).parent.parent.parent / "data" / "contracts.duckdb"


def _ensure_table():
    conn = duckdb.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS extracted_contracts (
            id VARCHAR PRIMARY KEY,
            filename VARCHAR,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expiration_date VARCHAR,
            renewal_option VARCHAR,
            pricing_structure VARCHAR,
            contract_value VARCHAR,
            parties VARCHAR,
            key_conditions VARCHAR,
            summary VARCHAR,
            source VARCHAR DEFAULT 'pdf_upload'
        )
    """)
    conn.close()


def store_extraction(filename: str, extraction: Dict) -> str:
    """Store extracted contract terms in DuckDB. Returns the record ID."""
    import hashlib
    record_id = hashlib.md5(f"{filename}:{datetime.now().isoformat()}".encode()).hexdigest()[:12]

    _ensure_table()
    conn = duckdb.connect(str(DB_PATH))
    try:
        conn.execute("""
            INSERT INTO extracted_contracts (id, filename, expiration_date, renewal_option,
                pricing_structure, contract_value, parties, key_conditions, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            record_id,
            filename,
            extraction.get("expiration_date"),
            extraction.get("renewal_option"),
            extraction.get("pricing_structure"),
            extraction.get("contract_value"),
            ", ".join(extraction.get("parties", [])) if isinstance(extraction.get("parties"), list) else extraction.get("parties"),
            ", ".join(extraction.get("key_conditions", [])) if isinstance(extraction.get("key_conditions"), list) else extraction.get("key_conditions"),
            extraction.get("summary"),
        ])
        return record_id
    finally:
        conn.close()


def list_extractions():
    """List all extracted contracts."""
    _ensure_table()
    conn = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        rows = conn.execute("""
            SELECT id, filename, CAST(uploaded_at AS VARCHAR) AS uploaded_at,
                expiration_date, renewal_option, pricing_structure, contract_value,
                parties, key_conditions, summary
            FROM extracted_contracts
            ORDER BY uploaded_at DESC
        """).fetchall()
        columns = ["id", "filename", "uploaded_at", "expiration_date", "renewal_option",
                   "pricing_structure", "contract_value", "parties", "key_conditions", "summary"]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()
