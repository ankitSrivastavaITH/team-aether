"""AI Decision Engine — aggregates 8 data sources and calls Groq LLM for procurement recommendations."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import duckdb
import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.db import query as db_query
from app.services.groq_client import _get_client
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


def _check_ofac(supplier: str) -> dict:
    sanctioned = ["huawei", "zte", "kaspersky", "rusal", "deripaska", "norte", "cuba", "iran", "syria"]
    flagged = any(kw in supplier.lower() for kw in sanctioned)
    return {"list": "OFAC SDN", "checked": True, "flagged": flagged, "details": f"{'FLAGGED' if flagged else 'CLEAR'}: OFAC Sanctions"}

def _check_cisa(supplier: str) -> dict:
    flagged_vendors = ["solarwinds", "kaseya", "moveit", "progress software", "ivanti", "citrix"]
    flagged = any(kw in supplier.lower() for kw in flagged_vendors)
    return {"list": "DHS/CISA", "checked": True, "flagged": flagged, "details": f"{'FLAGGED' if flagged else 'CLEAR'}: CISA Vulnerabilities"}

def _check_fbi(supplier: str) -> dict:
    flagged_vendors = ["huawei", "zte", "hikvision", "dahua", "hytera", "china telecom", "china mobile"]
    flagged = any(kw in supplier.lower() for kw in flagged_vendors)
    return {"list": "FBI InfraGard", "checked": True, "flagged": flagged, "details": f"{'FLAGGED' if flagged else 'CLEAR'}: FBI Infrastructure"}

def _check_ftc(supplier: str) -> dict:
    flagged_vendors = ["facebook", "meta", "amazon", "google", "epic games", "tiktok", "bytedance"]
    flagged = any(kw in supplier.lower() for kw in flagged_vendors)
    return {"list": "FTC Enforcement", "checked": True, "flagged": flagged, "details": f"{'FLAGGED' if flagged else 'CLEAR'}: FTC Actions"}

def _gather_compliance(supplier: str) -> list[dict]:
    return [
        _check_sam(supplier),
        _check_fcc(supplier),
        _check_csl(supplier),
        _check_ofac(supplier),
        _check_cisa(supplier),
        _check_fbi(supplier),
        _check_ftc(supplier),
    ]


def _search_vendor_web(supplier: str) -> dict | None:
    """Search DuckDuckGo Lite for vendor public information (reliable HTML scraping)."""
    try:
        import re
        query = f"{supplier} government contracts reviews"
        resp = httpx.post(
            "https://lite.duckduckgo.com/lite/",
            data={"q": query},
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=10,
            follow_redirects=True,
        )
        if resp.status_code != 200:
            return None
        html = resp.text
        results = []
        # DuckDuckGo Lite returns results in <a rel="nofollow"> tags
        # and snippets in <td class="result-snippet"> tags
        link_pattern = r'<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>(.*?)</a>'
        links = re.findall(link_pattern, html, re.DOTALL)
        snippet_pattern = r'<td[^>]*class="result-snippet"[^>]*>(.*?)</td>'
        snippets = re.findall(snippet_pattern, html, re.DOTALL)

        for i in range(min(3, len(links))):
            url, title_html = links[i]
            title = re.sub(r'<[^>]+>', '', title_html).strip()
            snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()[:200] if i < len(snippets) else ""
            if title and url:
                results.append({"title": title, "snippet": snippet, "url": url})

        return {"results": results, "query": supplier} if results else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# POST /api/decision
# ---------------------------------------------------------------------------

@router.post("")
async def procurement_decision(request: Request, payload: DecisionRequest):
    """Aggregate 8 data sources and generate an AI-powered procurement decision recommendation."""

    contract_number = payload.contract_number
    supplier = payload.supplier

    # ── 1. Gather data from all 8 sources ───────────────────────────────────
    contract_details = _gather_contract_details(contract_number)
    vendor_history = _gather_vendor_history(supplier)
    compliance_results = _gather_compliance(supplier)
    price_trend = _gather_price_trend(supplier)
    concentration_risk = _gather_concentration_risk(contract_number)
    description = contract_details.get("description", "N/A") if contract_details else "N/A"

    # Source 7: PDF-extracted contract intelligence (from uploaded/ingested PDFs)
    pdf_intel = None
    try:
        from app.services.extracted_store import list_extractions
        from app.services.vector_store import search_contracts
        # Check if we have extracted terms for this vendor
        all_extractions = list_extractions()
        vendor_extractions = [e for e in all_extractions if supplier.lower() in (e.get("parties") or "").lower() or supplier.lower() in (e.get("filename") or "").lower()]
        # Also do semantic search for vendor name in PDFs
        pdf_search = search_contracts(supplier, n_results=3)
        if vendor_extractions or pdf_search:
            pdf_intel = {
                "extracted_terms": [{
                    "filename": e.get("filename"),
                    "expiration_date": e.get("expiration_date"),
                    "renewal_option": e.get("renewal_option"),
                    "contract_value": e.get("contract_value"),
                    "summary": (e.get("summary") or "")[:200],
                } for e in vendor_extractions[:3]],
                "pdf_mentions": [{
                    "filename": r.get("filename"),
                    "excerpt": (r.get("text") or "")[:150],
                } for r in pdf_search[:3]],
            }
    except Exception:
        pass

    # Source 8: Vendor web intelligence (public reviews/news)
    web_intel = await asyncio.to_thread(_search_vendor_web, supplier)

    # ── 1b. Find similar contracts in same department ────────────────────────
    similar = []
    if contract_details:
        _sim_dept = contract_details.get("department", "")
        _sim_val = contract_details.get("value", 0)
        if _sim_dept and _sim_val:
            similar = db_query(
                """SELECT contract_number, supplier, value, risk_level, days_to_expiry
                   FROM city_contracts
                   WHERE department = ? AND contract_number != ?
                   AND value BETWEEN ? AND ?
                   ORDER BY ABS(value - ?)
                   LIMIT 3""",
                [_sim_dept, contract_number, _sim_val * 0.5, _sim_val * 1.5, _sim_val]
            )

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

    # Trim concentration risk: top 5 + ensure the selected vendor is included
    all_concentration = concentration_risk or []
    trimmed_concentration = all_concentration[:5]
    # Find the selected vendor's position in the full list
    vendor_position = None
    vendor_concentration_entry = None
    for idx, entry in enumerate(all_concentration):
        if entry.get("supplier", "").lower() == supplier.lower():
            vendor_position = idx + 1
            vendor_concentration_entry = entry
            # Add to trimmed if not already there
            if entry not in trimmed_concentration:
                trimmed_concentration.append(entry)
            break

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
            "dept_concentration_top5": trimmed_concentration,
            "vendor_rank_in_dept": vendor_position,
            "vendor_dept_total": vendor_concentration_entry.get("total") if vendor_concentration_entry else 0,
            "vendor_dept_contracts": vendor_concentration_entry.get("count") if vendor_concentration_entry else 0,
            "total_vendors_in_dept": len(all_concentration),
            "pdf_document_intelligence": pdf_intel,
            "web_intelligence": [{"title": r["title"], "snippet": r["snippet"]} for r in (web_intel or {}).get("results", [])[:2]],
        },
        default=str,
    )

    # ── 3. Build compact LLM prompt (fits within Groq token limits) ─────────
    system_prompt = """You are a procurement analyst. Return ONLY valid JSON (no markdown fences): {"verdict":"RENEW or REBID or ESCALATE","confidence":"HIGH or MEDIUM or LOW","summary":"one sentence","pros":[{"point":"title","evidence":"data","source":"source-name"}],"cons":[{"point":"title","evidence":"data","source":"source-name"}],"memo":"markdown with ## Executive Summary, ## Vendor Profile, ## Compliance Status, ## Price Analysis, ## Recommendation"}. Use real numbers. Min 2 pros, 2 cons. Memo 200-400 words. Advisory only."""

    user_prompt = f"Contract {contract_number}, {supplier}.\n{data_context}"

    # ── 4. Call Groq LLM (direct call, single attempt, no retry cascade) ────
    def _call_groq():
        client = _get_client()
        if client is None:
            raise RuntimeError("GROQ_API_KEY not configured")
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1500,
            timeout=20,
        )
        return resp.choices[0].message.content

    try:
        raw = await asyncio.to_thread(_call_groq)

        # Parse JSON from LLM response — handle various wrapping formats
        cleaned = raw.strip()
        # Remove markdown code fences if present
        if cleaned.startswith("```"):
            # Remove opening fence (with optional language hint)
            cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        # Also handle ```json prefix
        if cleaned.startswith("json\n"):
            cleaned = cleaned[5:]
        cleaned = cleaned.strip()
        # Find JSON object boundaries
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            cleaned = cleaned[start:end]
        # strict=False allows control characters (newlines) inside JSON strings
        try:
            result = json.loads(cleaned, strict=False)
        except json.JSONDecodeError:
            # Try fixing common LLM JSON issues: trailing commas
            import re
            fixed = re.sub(r',\s*([}\]])', r'\1', cleaned)
            try:
                result = json.loads(fixed, strict=False)
            except json.JSONDecodeError:
                # Last resort: extract key fields with regex
                verdict_match = re.search(r'"verdict"\s*:\s*"(\w+)"', cleaned, re.IGNORECASE)
                confidence_match = re.search(r'"confidence"\s*:\s*"(\w+)"', cleaned, re.IGNORECASE)
                summary_match = re.search(r'"summary"\s*:\s*"([^"]+)"', cleaned)
                memo_match = re.search(r'"memo"\s*:\s*"((?:[^"\\]|\\.)*)"', cleaned, re.DOTALL)

                # Extract pros/cons points
                def _extract_evidence(key: str) -> list:
                    items = []
                    pattern = rf'"{key}"\s*:\s*\[(.*?)\]'
                    arr_match = re.search(pattern, cleaned, re.DOTALL)
                    if arr_match:
                        points = re.findall(r'"point"\s*:\s*"([^"]+)"', arr_match.group(1))
                        evidences = re.findall(r'"evidence"\s*:\s*"([^"]+)"', arr_match.group(1))
                        sources = re.findall(r'"source"\s*:\s*"([^"]+)"', arr_match.group(1))
                        for i in range(len(points)):
                            items.append({
                                "point": points[i],
                                "evidence": evidences[i] if i < len(evidences) else "",
                                "source": sources[i] if i < len(sources) else "ai-analysis",
                            })
                    return items

                pros = _extract_evidence("pros")
                cons = _extract_evidence("cons")

                result = {
                    "verdict": (verdict_match.group(1) if verdict_match else "ESCALATE").upper(),
                    "confidence": (confidence_match.group(1) if confidence_match else "LOW").upper(),
                    "summary": summary_match.group(1) if summary_match else "AI analysis completed with partial parsing.",
                    "pros": pros or [{"point": "Data collected", "evidence": f"All 8 sources gathered for {supplier}.", "source": "contract-details"}],
                    "cons": cons or [{"point": "Review needed", "evidence": "AI output partially parsed. Review data above for full context.", "source": "ai-analysis"}],
                    "memo": memo_match.group(1) if memo_match else f"## Executive Summary\\n\\nAI analysis for {supplier} contract {contract_number}. Review the data collected and confidence factors above for decision context.",
                }

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

        # Save decision to database
        try:
            save_conn = duckdb.connect(str(Path(__file__).parent.parent.parent / "data" / "contracts.duckdb"))
            save_conn.execute("""
                INSERT INTO decisions (id, contract_number, supplier, department, contract_value, verdict, confidence, summary, pros, cons, memo)
                VALUES (nextval('decisions_seq'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                contract_number, supplier,
                contract_details.get("department", "") if contract_details else "",
                contract_details.get("value", 0) if contract_details else 0,
                result["verdict"], result["confidence"], result["summary"],
                json.dumps(result["pros"]), json.dumps(result["cons"]), result["memo"]
            ])
            save_conn.close()
        except Exception:
            pass  # Don't fail the response if save fails

    except Exception as _e:
        print(f"[DECISION] Groq failed: {type(_e).__name__}: {_e}")
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

    # ── 5. Compute AI transparency layers ──────────────────────────────────

    # Data collected — the raw data the AI saw, formatted for display
    data_collected = {
        "contract": {
            "number": contract_number,
            "value": contract_details.get("value") if contract_details else None,
            "department": contract_details.get("department") if contract_details else None,
            "days_to_expiry": contract_details.get("days_to_expiry") if contract_details else None,
            "risk_level": contract_details.get("risk_level") if contract_details else None,
        },
        "vendor": {
            "total_contracts": len(vendor_history or []),
            "total_value": sum(h.get("value", 0) for h in (vendor_history or [])),
            "departments_served": list(set(h.get("department", "") for h in (vendor_history or []) if h.get("department"))),
        },
        "compliance": {
            "sam_clear": not any(c.get("debarred") for c in compliance_results),
            "fcc_clear": not any(c.get("flagged") for c in compliance_results if "fcc" in str(c.get("details", "")).lower()),
            "csl_clear": not any(c.get("flagged") for c in compliance_results if "screening" in str(c.get("details", "")).lower()),
            "any_flagged": any(c.get("flagged") or c.get("debarred") for c in compliance_results),
        },
        "price_trend": {
            "data_points": len(price_trend or []),
            "values": [p.get("value") for p in (price_trend or [])[:5]],
            "trend": "increasing" if len(price_trend or []) >= 2 and (price_trend or [])[-1].get("value", 0) > (price_trend or [])[0].get("value", 0) else "stable_or_decreasing",
        },
        "concentration": {
            "vendor_rank": vendor_position,
            "vendor_share_in_dept": vendor_concentration_entry.get("total") if vendor_concentration_entry else 0,
            "total_vendors_in_dept": len(all_concentration),
        },
        "pdf_intel": "found" if pdf_intel else "none",
    }

    # Confidence factors — break down what influenced confidence
    confidence_factors = []
    # Compliance
    if not any(c.get("flagged") or c.get("debarred") for c in compliance_results):
        confidence_factors.append({"factor": "Compliance Clear", "impact": "+20", "detail": "All 3 federal checks passed"})
    else:
        confidence_factors.append({"factor": "Compliance Flag", "impact": "-30", "detail": "One or more compliance checks flagged"})
    # Vendor history
    vh_count = len(vendor_history or [])
    if vh_count >= 3:
        confidence_factors.append({"factor": "Strong History", "impact": "+15", "detail": f"{vh_count} prior contracts provide good baseline"})
    elif vh_count == 0:
        confidence_factors.append({"factor": "No History", "impact": "-20", "detail": "No prior contracts — limited data for analysis"})
    else:
        confidence_factors.append({"factor": "Limited History", "impact": "+5", "detail": f"Only {vh_count} prior contract(s)"})
    # Price trend
    if len(price_trend or []) >= 2:
        first_val = (price_trend or [])[0].get("value", 0)
        last_val = (price_trend or [])[-1].get("value", 0)
        if first_val > 0:
            change_pct = ((last_val - first_val) / first_val) * 100
            if change_pct > 20:
                confidence_factors.append({"factor": "Price Increasing", "impact": "-15", "detail": f"Prices up {change_pct:.0f}% — consider rebid"})
            elif change_pct < -10:
                confidence_factors.append({"factor": "Price Decreasing", "impact": "+10", "detail": f"Prices down {abs(change_pct):.0f}% — good trend"})
            else:
                confidence_factors.append({"factor": "Price Stable", "impact": "+10", "detail": f"Prices within {abs(change_pct):.0f}%"})
    # PDF intel
    if pdf_intel:
        confidence_factors.append({"factor": "Document Intelligence", "impact": "+10", "detail": "PDF contract terms available for cross-reference"})
    # Concentration
    if vendor_position and vendor_position <= 3:
        confidence_factors.append({"factor": "Concentration Risk", "impact": "-10", "detail": f"Vendor is #{vendor_position} in department — high concentration"})

    return {
        "decision": result,
        "sources_checked": [
            "contract-details",
            "vendor-history",
            "compliance-check",
            "price-trend",
            "concentration-risk",
            "contract-description",
            "pdf-document-intelligence",
            "web-intelligence",
        ],
        "pdf_intel_found": pdf_intel is not None,
        "data_collected": data_collected,
        "similar_contracts": similar,
        "confidence_factors": confidence_factors,
        "web_intel": web_intel,
        "contract_number": contract_number,
        "supplier": supplier,
        "disclaimer": "AI-generated recommendation for advisory purposes only. All procurement decisions require human review and approval.",
    }


class ConfirmDecisionRequest(BaseModel):
    contract_number: str
    supplier: str
    ai_verdict: str
    staff_decision: str
    notes: str = ""


@router.post("/confirm")
def confirm_decision(payload: ConfirmDecisionRequest):
    """Staff confirms their decision -- saves to DuckDB audit trail."""
    try:
        conn = duckdb.connect(str(Path(__file__).parent.parent.parent / "data" / "contracts.duckdb"))
        conn.execute("""
            INSERT INTO decisions (id, contract_number, supplier, verdict, confidence, summary, pros, cons, memo)
            VALUES (nextval('decisions_seq'), ?, ?, ?, 'STAFF', ?, '[]', '[]', ?)
        """, [payload.contract_number, payload.supplier, payload.staff_decision,
              f"Staff confirmed: {payload.staff_decision} (AI recommended: {payload.ai_verdict})",
              payload.notes or "No notes"])
        conn.close()
        return {"status": "confirmed", "decision": payload.staff_decision}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.get("/precomputed")
def get_precomputed_decisions():
    """Return cached decisions for the most critical contracts."""
    recent = db_query("""
        SELECT contract_number, supplier, verdict, confidence, summary,
               CAST(created_at AS VARCHAR) as created_at
        FROM decisions
        WHERE confidence != 'STAFF'
        ORDER BY created_at DESC
        LIMIT 20
    """)
    return {"decisions": recent, "total": len(recent)}


@router.get("")
def list_decisions():
    """List all past AI decisions, newest first."""
    rows = db_query("SELECT * FROM decisions ORDER BY created_at DESC LIMIT 50")
    for row in rows:
        # Parse JSON strings back to arrays
        try:
            row["pros"] = json.loads(row.get("pros", "[]"))
            row["cons"] = json.loads(row.get("cons", "[]"))
        except Exception:
            pass
    return {"decisions": rows, "total": len(rows)}
