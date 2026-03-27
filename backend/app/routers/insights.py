"""AI-generated spending insights and risk narratives."""

import json
from typing import Optional
from fastapi import APIRouter, Query
from app.db import query as db_query
from app.services.groq_client import chat

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("/summary")
def spending_summary():
    """Generate AI-powered summary of contract data."""

    # Gather key data points
    stats = db_query("""
        SELECT
            COUNT(*) AS total,
            SUM(value) AS total_value,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS expiring_30,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 60 THEN 1 ELSE 0 END) AS expiring_60,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 90 THEN 1 ELSE 0 END) AS expiring_90,
            SUM(CASE WHEN risk_level = 'expired' THEN 1 ELSE 0 END) AS expired
        FROM city_contracts
    """)[0]

    top_depts = db_query("""
        SELECT department, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts GROUP BY department
        ORDER BY total_value DESC LIMIT 5
    """)

    critical_contracts = db_query("""
        SELECT supplier, department, value, days_to_expiry
        FROM city_contracts
        WHERE days_to_expiry BETWEEN 0 AND 30
        ORDER BY value DESC LIMIT 5
    """)

    top_vendors = db_query("""
        SELECT supplier, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts GROUP BY supplier
        ORDER BY total_value DESC LIMIT 5
    """)

    data_context = json.dumps({
        "stats": stats,
        "top_departments": top_depts,
        "critical_contracts": critical_contracts,
        "top_vendors": top_vendors,
    }, default=str)

    system_prompt = """You are a civic data analyst writing plain-English insights about Richmond, VA city contracts.
Write exactly 5 bullet-point insights that a Richmond resident or procurement officer would find valuable.
Each insight must:
- Start with a specific number or fact
- Be one sentence, under 25 words
- Be understandable by someone with no government experience
- Not make any compliance or legal judgments

Return ONLY a JSON array of 5 strings. No markdown, no code fences. Example:
["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]"""

    raw = chat(system_prompt, f"Contract data:\n{data_context}")

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        insights = json.loads(cleaned.strip())
        if not isinstance(insights, list):
            insights = [str(insights)]
    except (json.JSONDecodeError, IndexError):
        # Fallback: generate insights from raw data without AI
        insights = [
            f"Richmond manages {stats['total']:,} contracts worth ${stats['total_value']:,.0f} across city departments.",
            f"{stats['expiring_30']} contracts are expiring within the next 30 days and need renewal attention.",
            f"{stats['expired']} contracts in the database have already passed their expiration date.",
            f"{top_depts[0]['department']} leads spending at ${top_depts[0]['total_value']:,.0f} across {top_depts[0]['count']} contracts.",
            f"The top vendor, {top_vendors[0]['supplier']}, holds {top_vendors[0]['count']} contracts worth ${top_vendors[0]['total_value']:,.0f}.",
        ]

    return {
        "insights": insights,
        "disclaimer": "AI-generated summary for informational purposes. Verify all figures against official records.",
    }


@router.get("/risk-narrative")
def risk_narrative():
    """Generate a risk-focused narrative for staff."""

    critical = db_query("""
        SELECT supplier, department, value, days_to_expiry, description
        FROM city_contracts
        WHERE days_to_expiry BETWEEN 0 AND 30
        ORDER BY value DESC LIMIT 10
    """)

    dept_risk = db_query("""
        SELECT department,
            COUNT(*) AS total,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS critical,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 60 THEN 1 ELSE 0 END) AS at_risk,
            SUM(value) AS total_value
        FROM city_contracts
        WHERE days_to_expiry BETWEEN 0 AND 90
        GROUP BY department
        ORDER BY critical DESC
        LIMIT 5
    """)

    data_context = json.dumps({
        "critical_contracts": critical,
        "department_risk": dept_risk,
    }, default=str)

    system_prompt = """You are a procurement risk analyst writing a brief risk summary for city staff.
Write exactly 4 actionable bullet points about contracts needing immediate attention.
Each bullet must:
- Start with a department name or vendor name
- Include a specific dollar amount or timeline
- Suggest a concrete next step (review, renew, escalate)
- Be one sentence, under 30 words

Return ONLY a JSON array of 4 strings. No markdown, no code fences."""

    raw = chat(system_prompt, f"Risk data:\n{data_context}")

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        narratives = json.loads(cleaned.strip())
        if not isinstance(narratives, list):
            narratives = [str(narratives)]
    except (json.JSONDecodeError, IndexError):
        narratives = [
            f"{len(critical)} high-value contracts expire within 30 days — review renewal options immediately.",
            f"{dept_risk[0]['department'] if dept_risk else 'Multiple departments'} has the most contracts at risk.",
            "Prioritize contracts by value to maximize renewal impact.",
            "Contact vendors with expiring contracts to begin renewal discussions.",
        ]

    return {
        "narratives": narratives,
        "disclaimer": "AI-generated risk summary. All procurement decisions require human review.",
    }
