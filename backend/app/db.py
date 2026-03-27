import os
import duckdb
from typing import Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "contracts.duckdb")


def query(sql: str, params: Optional[List[Any]] = None) -> List[dict]:
    """Execute a SQL query against the DuckDB database and return a list of dicts."""
    conn = None
    try:
        conn = duckdb.connect(DB_PATH, read_only=True)
        if params:
            result = conn.execute(sql, params)
        else:
            result = conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        rows = result.fetchall()
        return [dict(zip(columns, row)) for row in rows]
    finally:
        if conn:
            conn.close()
