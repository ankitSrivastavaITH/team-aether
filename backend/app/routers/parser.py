"""AI-powered contract description parser — extracts structured data from free text descriptions."""

import json
from fastapi import APIRouter
from app.db import query
from app.services.groq_client import chat

router = APIRouter(prefix="/api/parser", tags=["parser"])


@router.get("/parse/{contract_number}")
def parse_contract(contract_number: str):
    """Parse a single contract's description into structured fields."""
    rows = query(
        "SELECT description, supplier, department, value FROM city_contracts WHERE contract_number = ?",
        [contract_number],
    )
    if not rows:
        return {"error": "Contract not found"}

    desc = rows[0].get("description", "")
    if not desc:
        return {"error": "No description available", "contract_number": contract_number}

    prompt = """Extract structured information from this government contract description.
Return ONLY a JSON object with these fields (set to null if not found):
{
  "solicitation_number": "the IFB/RFP/RFQ number if present",
  "procurement_method": "IFB (Invitation for Bid) / RFP (Request for Proposal) / Cooperative / Small Purchase / etc.",
  "original_term": "e.g., '2 years' or '960 calendar days'",
  "renewal_structure": "e.g., 'Four (4) one-year renewals' or 'No renewals'",
  "total_possible_term": "e.g., '6 years' (original + all renewals)",
  "scope_summary": "One sentence plain-English summary of what this contract is for",
  "key_details": ["list of other notable details extracted from the text"]
}
No markdown fences. Raw JSON only."""

    try:
        raw = chat(prompt, f"Contract description:\n{desc}")
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned.strip())
    except Exception:
        parsed = {
            "solicitation_number": None,
            "procurement_method": None,
            "original_term": None,
            "renewal_structure": None,
            "total_possible_term": None,
            "scope_summary": desc[:200],
            "key_details": [],
        }

    return {
        "contract_number": contract_number,
        "raw_description": desc,
        "parsed": parsed,
        "supplier": rows[0].get("supplier"),
        "department": rows[0].get("department"),
        "value": rows[0].get("value"),
        "disclaimer": "AI-extracted — verify against original contract documents.",
    }


@router.get("/batch-stats")
def batch_parse_stats():
    """Quick stats about what can be parsed from descriptions."""
    stats = query("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN description ILIKE '%IFB%' THEN 1 ELSE 0 END) AS ifb_count,
            SUM(CASE WHEN description ILIKE '%RFP%' THEN 1 ELSE 0 END) AS rfp_count,
            SUM(CASE WHEN description ILIKE '%cooperative%' THEN 1 ELSE 0 END) AS cooperative_count,
            SUM(CASE WHEN description ILIKE '%renewal%' THEN 1 ELSE 0 END) AS has_renewal_info,
            SUM(CASE WHEN description ILIKE '%year%' OR description ILIKE '%days%' THEN 1 ELSE 0 END) AS has_term_info,
            SUM(CASE WHEN description ILIKE '%requisition%' THEN 1 ELSE 0 END) AS has_requisition
        FROM city_contracts
    """)
    return {"stats": stats[0] if stats else {}}
