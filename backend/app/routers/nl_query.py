"""Natural language to SQL query endpoint."""

import json
import hashlib
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.groq_client import chat
from app.db import query

_query_cache: dict = {}

router = APIRouter(prefix="/api/nl-query", tags=["nl-query"])

NL_TO_SQL_PROMPT = """You are a SQL assistant for a Richmond City contracts database. Convert the user's natural language question into a DuckDB SQL query.

The database has one table: city_contracts with these columns:
- department (VARCHAR): City department name (e.g., "Public Utilities", "Public Works", "Information Technology")
- contract_number (VARCHAR): Unique contract identifier
- value (DOUBLE): Contract dollar value
- supplier (VARCHAR): Vendor/company name
- procurement_type (VARCHAR): How it was procured (e.g., "Agency Request", "Invitation to Bid")
- description (VARCHAR): Free text description of the contract
- solicitation_type (VARCHAR): Type of solicitation
- start_date (DATE): Contract start date
- end_date (DATE): Contract end date
- days_to_expiry (INTEGER): Days until contract expires (negative means already expired)
- risk_level (VARCHAR): One of: critical (<=30 days), warning (31-60), attention (61-90), ok (>90), expired, unknown

Today's date is 2026-03-27. There are 1,365 total contracts worth approximately $6.1 billion.

RULES:
- Return ONLY a JSON object: {"sql": "SELECT ...", "explanation": "plain English explanation of what this query does"}
- Only SELECT queries allowed — no INSERT, UPDATE, DELETE, DROP, ALTER
- Use ILIKE for text matching (case insensitive)
- Limit results to 100 rows unless the user asks for more
- Format currency values with value column (DOUBLE type)
- For "expiring soon" queries, use days_to_expiry BETWEEN 0 AND N
- Do NOT wrap response in markdown code fences
- Return raw JSON only"""


class NLQueryRequest(BaseModel):
    question: str


@router.post("")
def nl_query(req: NLQueryRequest):
    """Convert natural language question to SQL, execute, and return results."""
    # Check cache
    cache_key = hashlib.md5(req.question.lower().strip().encode()).hexdigest()
    if cache_key in _query_cache:
        return _query_cache[cache_key]

    raw = chat(NL_TO_SQL_PROMPT, req.question)

    try:
        cleaned = raw.strip()
        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        sql = parsed.get("sql", "").strip()
        explanation = parsed.get("explanation", "")

        # Safety check
        sql_upper = sql.upper()
        if not sql_upper.startswith("SELECT"):
            return {"error": "Only SELECT queries are allowed for safety."}

        for forbidden in ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE"]:
            if forbidden in sql_upper.split("SELECT", 1)[0]:
                return {"error": f"Query contains forbidden keyword: {forbidden}"}

        results = query(sql)
        result = {
            "sql": sql,
            "explanation": explanation,
            "results": results[:100],
            "total": len(results),
        }

        # Cache successful results (no "error" key)
        _query_cache[cache_key] = result
        # Limit cache size to 100 entries (evict oldest)
        if len(_query_cache) > 100:
            oldest = next(iter(_query_cache))
            del _query_cache[oldest]

        return result
    except json.JSONDecodeError:
        return {"error": "Could not understand that question. Try rephrasing.", "raw": raw[:300]}
    except Exception as e:
        error_msg = str(e)
        if "Catalog Error" in error_msg or "Binder Error" in error_msg:
            return {"error": "That question didn't translate to a valid query. Try being more specific about column names like 'department', 'supplier', or 'value'."}
        return {"error": f"Query execution error: {error_msg}"}
