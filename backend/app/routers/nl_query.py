"""Natural language to SQL query endpoint."""

import asyncio
import json
import hashlib
from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.services.groq_client import chat
from app.db import query
from app.rate_limit import limiter

_query_cache: dict = {}

router = APIRouter(prefix="/api/nl-query", tags=["nl-query"])

def _get_nl_prompt():
    from datetime import date
    today = date.today().isoformat()
    return f"""You are a SQL assistant for a Richmond City contracts database. Convert the user's natural language question into a DuckDB SQL query.

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

Today's date is {today}. There are ~1,365 total contracts worth ~$6.1 billion.

COMMON QUERY PATTERNS (use these as templates):
- "expiring this month": SELECT * FROM city_contracts WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' ORDER BY end_date ASC LIMIT 100
- "expiring in X days": SELECT * FROM city_contracts WHERE days_to_expiry BETWEEN 0 AND X ORDER BY days_to_expiry ASC LIMIT 100
- "expiring this quarter": SELECT * FROM city_contracts WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' ORDER BY end_date ASC
- "expired contracts": SELECT * FROM city_contracts WHERE days_to_expiry < 0 ORDER BY value DESC LIMIT 100
- "top vendors": SELECT supplier, COUNT(*) AS num_contracts, SUM(value) AS total_value FROM city_contracts GROUP BY supplier ORDER BY total_value DESC LIMIT 10
- "top departments": SELECT department, COUNT(*) AS contracts, SUM(value) AS total_value FROM city_contracts GROUP BY department ORDER BY total_value DESC
- "contracts with [vendor]": SELECT * FROM city_contracts WHERE supplier ILIKE '%vendor%' ORDER BY value DESC
- "contracts over $X": SELECT * FROM city_contracts WHERE value > X ORDER BY value DESC LIMIT 100
- "[department] contracts": SELECT * FROM city_contracts WHERE department ILIKE '%dept%' ORDER BY days_to_expiry ASC LIMIT 100
- "largest contracts": SELECT * FROM city_contracts ORDER BY value DESC LIMIT 20
- "how many contracts": SELECT COUNT(*) as total, SUM(value) as total_value FROM city_contracts
- "vendor with most contracts": SELECT supplier, COUNT(*) as contracts FROM city_contracts GROUP BY supplier ORDER BY contracts DESC LIMIT 10

RULES:
- Return ONLY a JSON object: {{"sql": "SELECT ...", "explanation": "plain English explanation"}}
- Only SELECT queries — no INSERT, UPDATE, DELETE, DROP, ALTER
- Use ILIKE for text matching (case insensitive)
- Limit to 100 rows unless user asks for more
- For time-based queries ("this month", "next 30 days", "this year"), use end_date with INTERVAL or CURRENT_DATE
- For "expiring soon", use days_to_expiry BETWEEN 0 AND N
- Always include ORDER BY
- Use SUM, COUNT, AVG for aggregate questions
- Do NOT wrap in markdown code fences — raw JSON only"""


class NLQueryRequest(BaseModel):
    question: str


@router.post("")
@limiter.limit("10/minute")
async def nl_query(request: Request, req: NLQueryRequest):
    """Convert natural language question to SQL, execute, and return results."""
    # Check cache
    cache_key = hashlib.md5(req.question.lower().strip().encode()).hexdigest()
    if cache_key in _query_cache:
        return _query_cache[cache_key]

    # Call 1: NL -> SQL (must complete first -- need the SQL to execute)
    raw = await asyncio.to_thread(chat, _get_nl_prompt(), req.question)

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

        # Calls 2 & 3: Run analysis and follow-up generation in parallel.
        # Both depend only on results + original question, not on each other.
        analysis = ""
        followups = []

        if results and len(results) > 0:
            async def _generate_analysis() -> str:
                """Call 2: Generate AI analysis of the query results."""
                try:
                    analysis_data = json.dumps(results[:20], default=str)
                    total_val = sum(r.get("value", 0) for r in results if isinstance(r.get("value"), (int, float)))
                    analysis_prompt = f"""You are a procurement analyst. Write a 3-4 sentence analysis of these query results.

FACTS (use these exact numbers, do NOT make up different numbers):
- Total results: {len(results)} contracts
- Total value: ${total_val:,.2f}
- Question asked: {req.question}

Include key takeaways, risks, and patterns. Use **bold** for key figures. Be concise. Return ONLY markdown text."""
                    return await asyncio.to_thread(
                        chat, analysis_prompt,
                        f"Results ({len(results)} rows, ${total_val:,.2f} total):\n{analysis_data}"
                    )
                except Exception:
                    return ""

            async def _generate_followups() -> list:
                """Call 3: Generate follow-up question suggestions."""
                try:
                    followup_prompt = """Given the user's question and the results, suggest exactly 3 follow-up questions they might want to ask next.
Each question should be a natural language query about Richmond city contracts.
Return ONLY a JSON array of 3 strings. No markdown, no code fences. Example: ["question 1", "question 2", "question 3"]"""
                    followup_raw = await asyncio.to_thread(
                        chat, followup_prompt,
                        f"Question: {req.question}\nResults: {len(results)} rows returned"
                    )
                    cleaned_f = followup_raw.strip()
                    if cleaned_f.startswith("```"):
                        cleaned_f = cleaned_f.split("\n", 1)[1]
                    if cleaned_f.endswith("```"):
                        cleaned_f = cleaned_f.rsplit("```", 1)[0]
                    parsed_f = json.loads(cleaned_f.strip())
                    if not isinstance(parsed_f, list):
                        return []
                    return parsed_f
                except Exception:
                    return []

            analysis, followups = await asyncio.gather(
                _generate_analysis(),
                _generate_followups(),
            )

        result = {
            "sql": sql,
            "explanation": explanation,
            "results": results[:100],
            "total": len(results),
            "analysis": analysis,
            "followups": followups[:3],
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
