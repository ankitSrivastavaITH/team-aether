"""AI Decision Engine — aggregates 6 data sources and calls Groq LLM for procurement recommendations."""

from __future__ import annotations

import asyncio
import json

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.db import query as db_query
from app.services.groq_client import chat
from app.rate_limit import limiter

router = APIRouter(prefix="/api/decision", tags=["decision"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class DecisionRequest(BaseModel):
    contract_number: str
    supplier: str


# ---------------------------------------------------------------------------
# Compliance check helpers (mirrors contracts.py logic inline)
# ---------------------------------------------------------------------------

FCC_COVERED_ENTITIES = [
    "huawei", "zte", "hytera", "hikvision", "dahua",
    "china mobile", "china telecom", "china unicom",
    "kaspersky", "pacific network", "comnet",
]


def _check_fcc(supplier: str) -> dict:
    supplier_lower = supplier.lower()
    flagged = any(entity in supplier_lower for entity in FCC_COVERED_ENTITIES)
    return {
        "source": "FCC Covered List",
        "checked": True,
        "flagged": flagged,
        "details": (
            f"MATCH: {supplier} matches FCC Covered List prohibited manufacturer"
            if flagged
            else f"CLEAR: {supplier} not found on FCC Covered List"
        ),
    }


def _check_sam(supplier: str) -> dict:
    try:
        resp = httpx.get(
            "https://api.sam.gov/entity-information/v3/exclusions",
            params={
                "api_key": "SAM-70b6309d-7278-4955-b726-96dd471362df",
                "q": supplier,
                "limit": 5,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            total = data.get("totalRecords", 0)
            return {
                "source": "SAM.gov Exclusions",
                "checked": True,
                "flagged": total > 0,
                "matches": total,
                "details": (
                    f"MATCH: {total} exclusion record(s) found in SAM.gov"
                    if total > 0
                    else f"CLEAR: No exclusion records for {supplier} in SAM.gov"
                ),
            }
        return {"source": "SAM.gov Exclusions", "checked": False, "flagged": False, "details": "SAM.gov API returned error"}
    except Exception:
        return {"source": "SAM.gov Exclusions", "checked": False, "flagged": False, "details": "SAM.gov API unreachable"}


def _check_csl(supplier: str) -> dict:
    try:
        resp = httpx.get(
            "https://api.trade.gov/consolidated_screening_list/v1/search",
            params={"api_key": "II3L3IFmlbnMEJagCG4bV0F2", "q": supplier, "limit": 5},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            total = data.get("total", 0)
            return {
                "source": "Consolidated Screening List",
                "checked": True,
                "flagged": total > 0,
                "matches": total,
                "details": (
                    f"MATCH: {total} record(s) found on Consolidated Screening List"
                    if total > 0
                    else f"CLEAR: No records found for {supplier}"
                ),
            }
        return {"source": "Consolidated Screening List", "checked": False, "flagged": False, "details": "Could not reach Commerce Screening List API"}
    except Exception:
        return {"source": "Consolidated Screening List", "checked": False, "flagged": False, "details": "Could not reach Commerce Screening List API"}


# ---------------------------------------------------------------------------
# Data gathering helpers
# ---------------------------------------------------------------------------

def _gather_contract_details(contract_number: str) -> dict | None:
    rows = db_query(
        "SELECT * FROM city_contracts WHERE contract_number = ?",
        [contract_number],
    )
    return rows[0] if rows else None


def _gather_vendor_history(supplier: str) -> list[dict]:
    return db_query(
        "SELECT * FROM city_contracts WHERE supplier = ? ORDER BY start_date",
        [supplier],
    )


def _gather_price_trend(supplier: str) -> list[dict]:
    return db_query(
        "SELECT contract_number, value, CAST(start_date AS VARCHAR) AS start_date FROM city_contracts WHERE supplier = ? ORDER BY start_date",
        [supplier],
    )


def _gather_concentration_risk(contract_number: str) -> list[dict]:
    return db_query(
        """
        SELECT department, supplier, SUM(value) as total, COUNT(*) as count
        FROM city_contracts
        WHERE department = (
            SELECT department FROM city_contracts WHERE contract_number = ?
        )
        GROUP BY department, supplier
        ORDER BY total DESC
        """,
        [contract_number],
    )


def _gather_compliance(supplier: str) -> list[dict]:
    return [
        _check_sam(supplier),
        _check_fcc(supplier),
        _check_csl(supplier),
    ]


# ---------------------------------------------------------------------------
# POST /api/decision
# ---------------------------------------------------------------------------

@router.post("")
async def procurement_decision(request: Request, payload: DecisionRequest):
    """Aggregate 6 data sources and generate an AI-powered procurement decision recommendation."""

    contract_number = payload.contract_number
    supplier = payload.supplier

    # ── 1. Gather data from all 6 sources ───────────────────────────────────
    contract_details = _gather_contract_details(contract_number)
    vendor_history = _gather_vendor_history(supplier)
    compliance_results = _gather_compliance(supplier)
    price_trend = _gather_price_trend(supplier)
    concentration_risk = _gather_concentration_risk(contract_number)
    description = contract_details.get("description", "N/A") if contract_details else "N/A"

    # ── 2. Build the data context (trimmed to fit LLM token limits) ─────────
    # Keep vendor history lean: only key fields, max 5 contracts
    trimmed_history = []
    for h in (vendor_history or [])[:5]:
        trimmed_history.append({
            "contract_number": h.get("contract_number"),
            "value": h.get("value"),
            "department": h.get("department"),
            "start_date": str(h.get("start_date", "")),
            "end_date": str(h.get("end_date", "")),
            "risk_level": h.get("risk_level"),
        })

    # Trim concentration risk to top 5
    trimmed_concentration = (concentration_risk or [])[:5]

    # Trim price trend to key points
    trimmed_trend = []
    for p in (price_trend or [])[:5]:
        trimmed_trend.append({
            "contract_number": p.get("contract_number"),
            "value": p.get("value"),
            "start_date": str(p.get("start_date", "")),
        })

    # Trim description to 300 chars
    trimmed_desc = (description or "N/A")[:300]

    data_context = json.dumps(
        {
            "contract": {
                "number": contract_details.get("contract_number") if contract_details else None,
                "supplier": contract_details.get("supplier") if contract_details else None,
                "department": contract_details.get("department") if contract_details else None,
                "value": contract_details.get("value") if contract_details else None,
                "start_date": str(contract_details.get("start_date", "")) if contract_details else None,
                "end_date": str(contract_details.get("end_date", "")) if contract_details else None,
                "risk_level": contract_details.get("risk_level") if contract_details else None,
                "description": trimmed_desc,
            },
            "vendor_contracts": trimmed_history,
            "total_vendor_contracts": len(vendor_history or []),
            "compliance": compliance_results,
            "price_history": trimmed_trend,
            "dept_concentration": trimmed_concentration,
        },
        default=str,
    )

    # ── 3. Build the LLM prompt ─────────────────────────────────────────────
    system_prompt = """You are a senior procurement analyst for the City of Richmond, VA.
You are given data from 6 sources about a specific contract and vendor. Analyze ALL the data and produce a structured procurement decision recommendation.

You MUST return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "verdict": "RENEW" or "REBID" or "ESCALATE",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "summary": "One sentence summary of your recommendation",
  "pros": [
    { "point": "Short title", "evidence": "Specific data supporting this point", "source": "which data source" }
  ],
  "cons": [
    { "point": "Short title", "evidence": "Specific data supporting this concern", "source": "which data source" }
  ],
  "memo": "Full markdown decision memo with sections: ## Executive Summary, ## Vendor Profile, ## Compliance Status, ## Price Analysis, ## Risk Assessment, ## Recommendation"
}

Rules for your analysis:
- Use ACTUAL numbers from the data (dollar amounts, dates, counts) — do not make up figures.
- "source" field must be one of: contract-details, vendor-history, compliance-check, price-trend, concentration-risk, contract-description.
- verdict RENEW = vendor is performing well, pricing is fair, no compliance flags.
- verdict REBID = concerns about price increases, concentration risk, or minor compliance issues warrant competitive bidding.
- verdict ESCALATE = serious compliance flags, debarment matches, or insufficient data require human review.
- Include at least 2 pros and 2 cons when data supports them.
- The memo should be comprehensive (300-500 words) and reference specific data points.
- Do NOT make legal determinations. Label all analysis as advisory."""

    user_prompt = f"""Analyze this procurement data and generate a decision recommendation.

Contract Number: {contract_number}
Supplier: {supplier}

Data from 6 sources:
{data_context}"""

    # ── 4. Call Groq LLM ────────────────────────────────────────────────────
    try:
        raw = await asyncio.to_thread(chat, system_prompt, user_prompt)

        # Parse JSON from LLM response
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned.strip())

        # Validate required fields
        for field in ("verdict", "confidence", "summary", "pros", "cons", "memo"):
            if field not in result:
                raise ValueError(f"Missing required field: {field}")

        # Normalize verdict and confidence to expected values
        result["verdict"] = result["verdict"].upper()
        result["confidence"] = result["confidence"].upper()
        if result["verdict"] not in ("RENEW", "REBID", "ESCALATE"):
            result["verdict"] = "ESCALATE"
        if result["confidence"] not in ("HIGH", "MEDIUM", "LOW"):
            result["confidence"] = "LOW"

    except Exception:
        # Fallback when Groq is unavailable or returns bad data
        any_flagged = any(c.get("flagged", False) for c in compliance_results)
        result = {
            "verdict": "ESCALATE",
            "confidence": "LOW",
            "summary": "AI analysis unavailable — manual review required for this procurement decision.",
            "pros": [
                {
                    "point": "Data collected",
                    "evidence": f"Contract {contract_number} and vendor {supplier} data gathered from {len([x for x in [contract_details, vendor_history, compliance_results, price_trend, concentration_risk] if x])} sources.",
                    "source": "contract-details",
                }
            ],
            "cons": [
                {
                    "point": "AI analysis failed",
                    "evidence": "The AI decision engine was unable to process the data. A human analyst must review all gathered data.",
                    "source": "contract-details",
                }
            ],
            "memo": (
                "## Executive Summary\n\n"
                "AI-powered analysis is currently unavailable. All gathered data should be reviewed manually.\n\n"
                f"## Vendor Profile\n\n"
                f"Supplier: {supplier}\n"
                f"Total contracts found: {len(vendor_history)}\n\n"
                f"## Compliance Status\n\n"
                f"{'WARNING: Vendor flagged on one or more compliance lists.' if any_flagged else 'No flags detected on auto-checked lists (SAM.gov, FCC, CSL).'}\n\n"
                f"## Recommendation\n\n"
                "This decision requires manual review by a procurement officer."
            ),
        }

    return {
        "decision": result,
        "sources_checked": [
            "contract-details",
            "vendor-history",
            "compliance-check",
            "price-trend",
            "concentration-risk",
            "contract-description",
        ],
        "contract_number": contract_number,
        "supplier": supplier,
        "disclaimer": "AI-generated recommendation for advisory purposes only. All procurement decisions require human review and approval.",
    }
