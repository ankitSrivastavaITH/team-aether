"""Portfolio-wide contract health scanner — pure SQL analytics, no LLM."""

from __future__ import annotations

from fastapi import APIRouter
from app.db import query

router = APIRouter(prefix="/api/health-scan", tags=["health-scan"])


@router.get("")
def portfolio_health_scan():
    """Scan all contracts and return a portfolio-wide health report."""

    # 1. Overall stats
    total = query(
        "SELECT COUNT(*) AS total, SUM(value) AS total_value FROM city_contracts"
    )[0]

    # 2. Risk distribution
    risk_dist = query(
        "SELECT risk_level, COUNT(*) AS count, SUM(value) AS value "
        "FROM city_contracts GROUP BY risk_level ORDER BY count DESC"
    )

    # 3. Health grade per department (A-F based on % critical+expired)
    dept_health = query("""
        SELECT department,
            COUNT(*) AS total,
            SUM(value) AS total_value,
            SUM(CASE WHEN risk_level='critical' THEN 1 ELSE 0 END) AS critical,
            SUM(CASE WHEN risk_level='warning' THEN 1 ELSE 0 END) AS warning,
            SUM(CASE WHEN risk_level='expired' THEN 1 ELSE 0 END) AS expired,
            SUM(CASE WHEN risk_level='ok' THEN 1 ELSE 0 END) AS ok
        FROM city_contracts
        GROUP BY department
        ORDER BY total_value DESC
    """)

    # Compute grade: A (0-5% at risk), B (5-15%), C (15-30%), D (30-50%), F (50%+)
    for d in dept_health:
        at_risk = (d["critical"] + d["expired"]) / max(d["total"], 1)
        if at_risk <= 0.05:
            d["grade"] = "A"
        elif at_risk <= 0.15:
            d["grade"] = "B"
        elif at_risk <= 0.30:
            d["grade"] = "C"
        elif at_risk <= 0.50:
            d["grade"] = "D"
        else:
            d["grade"] = "F"

    # 4. Top anomalies (contracts with concerning patterns)
    anomalies: list[dict] = []

    # Expired but high value
    expired_high = query(
        "SELECT supplier, contract_number, value, days_to_expiry "
        "FROM city_contracts "
        "WHERE risk_level='expired' AND value > 1000000 "
        "ORDER BY value DESC LIMIT 5"
    )
    for e in expired_high:
        anomalies.append({
            "type": "expired_high_value",
            "severity": "high",
            "supplier": e["supplier"],
            "contract_number": e["contract_number"],
            "value": e["value"],
            "detail": f"Expired contract worth ${e['value']:,.0f}",
        })

    # Single-source departments (>50% spend with one vendor)
    single_source = query("""
        WITH dept_totals AS (
            SELECT department, SUM(value) AS dept_total
            FROM city_contracts GROUP BY department
        ),
        vendor_share AS (
            SELECT c.department, c.supplier, SUM(c.value) AS vendor_total,
                   dt.dept_total,
                   SUM(c.value) / NULLIF(dt.dept_total, 0) * 100 AS pct
            FROM city_contracts c
            JOIN dept_totals dt ON c.department = dt.department
            GROUP BY c.department, c.supplier, dt.dept_total
        )
        SELECT department, supplier, vendor_total, pct
        FROM vendor_share WHERE pct > 50
        ORDER BY pct DESC LIMIT 5
    """)
    for s in single_source:
        anomalies.append({
            "type": "concentration_risk",
            "severity": "medium",
            "supplier": s["supplier"],
            "department": s["department"],
            "value": s["vendor_total"],
            "detail": f"{s['pct']:.0f}% of {s['department']} spend",
        })

    # 5. Portfolio-wide health score (0-100)
    total_contracts = total["total"]
    ok_count = sum(d["ok"] for d in dept_health)
    health_score = round((ok_count / max(total_contracts, 1)) * 100)

    # 6. Expiry forecast (next 30/60/90 days)
    forecast = query("""
        SELECT
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS next_30,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN value ELSE 0 END) AS value_30,
            SUM(CASE WHEN days_to_expiry BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS next_60,
            SUM(CASE WHEN days_to_expiry BETWEEN 31 AND 60 THEN value ELSE 0 END) AS value_60,
            SUM(CASE WHEN days_to_expiry BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS next_90,
            SUM(CASE WHEN days_to_expiry BETWEEN 61 AND 90 THEN value ELSE 0 END) AS value_90
        FROM city_contracts
    """)[0]

    return {
        "health_score": health_score,
        "total_contracts": total_contracts,
        "total_value": total["total_value"],
        "risk_distribution": risk_dist,
        "department_grades": dept_health,
        "anomalies": anomalies,
        "expiry_forecast": forecast,
    }
