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
            contract_number VARCHAR,
            contract_type VARCHAR,
            vendor_name VARCHAR,
            department VARCHAR,
            contract_value VARCHAR,
            commencement_date VARCHAR,
            expiration_date VARCHAR,
            performance_period VARCHAR,
            renewal_option VARCHAR,
            total_possible_term VARCHAR,
            pricing_structure VARCHAR,
            scope_of_work VARCHAR,
            mbe_requirement VARCHAR,
            insurance_requirement VARCHAR,
            bonding_requirement VARCHAR,
            liquidated_damages VARCHAR,
            parties VARCHAR,
            key_risks VARCHAR,
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
    def _join(val):
        if isinstance(val, list):
            return ", ".join(str(v) for v in val)
        return val

    conn = duckdb.connect(str(DB_PATH))
    try:
        conn.execute("""
            INSERT INTO extracted_contracts (id, filename, contract_number, contract_type, vendor_name,
                department, contract_value, commencement_date, expiration_date, performance_period,
                renewal_option, total_possible_term, pricing_structure, scope_of_work,
                mbe_requirement, insurance_requirement, bonding_requirement, liquidated_damages,
                parties, key_risks, key_conditions, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            record_id, filename,
            extraction.get("contract_number"),
            extraction.get("contract_type"),
            extraction.get("vendor_name"),
            extraction.get("department"),
            extraction.get("contract_value"),
            extraction.get("commencement_date"),
            extraction.get("expiration_date"),
            extraction.get("performance_period"),
            extraction.get("renewal_option"),
            extraction.get("total_possible_term"),
            extraction.get("pricing_structure"),
            extraction.get("scope_of_work"),
            extraction.get("mbe_requirement"),
            extraction.get("insurance_requirement"),
            extraction.get("bonding_requirement"),
            extraction.get("liquidated_damages"),
            _join(extraction.get("parties")),
            _join(extraction.get("key_risks")),
            _join(extraction.get("key_conditions")),
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
