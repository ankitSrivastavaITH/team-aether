"""Strategic procurement intelligence — What-If Estimator, Portfolio Strategy, Decision Timeline."""

from __future__ import annotations

import json
from typing import Any, Dict, List

from fastapi import APIRouter

from app.db import query

router = APIRouter(prefix="/api/strategy", tags=["strategy"])


def _fmt_currency(value: float) -> str:
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    if value >= 1_000:
        return f"${value / 1_000:.0f}K"
    return f"${value:,.0f}"


# ---------------------------------------------------------------------------
# What-If Savings Estimator
# ---------------------------------------------------------------------------

@router.get("/what-if")
def what_if_savings() -> Dict[str, Any]:
    """Estimate savings from rebidding high-concentration and expiring contracts."""

    # 1. Contracts where vendor has >50% department share (concentration risk)
    concentrated = query("""
        WITH dept_totals AS (
            SELECT department, SUM(value) AS dept_total
            FROM city_contracts GROUP BY department
        ),
        vendor_share AS (
            SELECT c.supplier, c.department, SUM(c.value) AS vendor_total,
                   dt.dept_total,
                   ROUND(SUM(c.value) * 100.0 / NULLIF(dt.dept_total, 0), 1) AS share_pct
            FROM city_contracts c
            JOIN dept_totals dt ON c.department = dt.department
            GROUP BY c.supplier, c.department, dt.dept_total
        )
        SELECT supplier, department, vendor_total, share_pct
        FROM vendor_share
        WHERE share_pct > 50 AND vendor_total > 100000
        ORDER BY vendor_total DESC
        LIMIT 10
    """)

    # 2. High-value expiring contracts (rebid candidates)
    expiring_high = query("""
        SELECT supplier, contract_number, department, value, days_to_expiry
        FROM city_contracts
        WHERE days_to_expiry BETWEEN 1 AND 180
          AND value > 500000
        ORDER BY value DESC
        LIMIT 10
    """)

    # 3. Calculate potential savings (conservative 5-15% from competitive rebid)
    concentrated_total = sum(c["vendor_total"] for c in concentrated)
    expiring_total = sum(c["value"] for c in expiring_high)

    all_values = concentrated_total + expiring_total
    conservative_savings = round(all_values * 0.05)
    moderate_savings = round(all_values * 0.10)
    aggressive_savings = round(all_values * 0.15)

    # 4. Department-level opportunities
    dept_opportunities = query("""
        WITH dept_stats AS (
            SELECT department,
                   COUNT(*) AS total,
                   SUM(value) AS total_value,
                   SUM(CASE WHEN days_to_expiry BETWEEN 1 AND 180 THEN 1 ELSE 0 END) AS expiring,
                   SUM(CASE WHEN days_to_expiry BETWEEN 1 AND 180 THEN value ELSE 0 END) AS expiring_value,
                   COUNT(DISTINCT supplier) AS unique_vendors
            FROM city_contracts
            GROUP BY department
        )
        SELECT department, total, total_value, expiring, expiring_value, unique_vendors,
               ROUND(expiring * 100.0 / NULLIF(total, 0), 1) AS expiring_pct
        FROM dept_stats
        WHERE expiring > 0
        ORDER BY expiring_value DESC
        LIMIT 8
    """)

    # 5. Generate actionable recommendations
    recommendations: List[Dict[str, str]] = []

    # Top rebid target
    if concentrated:
        top = concentrated[0]
        savings_10 = _fmt_currency(top["vendor_total"] * 0.10)
        recommendations.append({
            "priority": "critical",
            "action": f"Rebid {top['supplier']} contracts in {top['department']}",
            "detail": f"This vendor holds {top['share_pct']}% of department spending ({_fmt_currency(top['vendor_total'])}). "
                      f"Introducing competitive bidding could save {savings_10} at 10% reduction.",
            "next_step": "Identify 2-3 alternative vendors and issue RFP before current contract expires.",
        })

    # Urgent expiring
    if expiring_high:
        urgent = [c for c in expiring_high if c["days_to_expiry"] <= 60]
        if urgent:
            top_urgent = urgent[0]
            recommendations.append({
                "priority": "critical",
                "action": f"Immediate: {top_urgent['supplier']} contract expires in {top_urgent['days_to_expiry']} days",
                "detail": f"Contract {top_urgent['contract_number']} worth {_fmt_currency(top_urgent['value'])} in {top_urgent['department']}. "
                          f"Expiration within 60 days requires immediate decision — renew or rebid.",
                "next_step": "Run Decision Engine analysis on this contract today. Prepare renewal paperwork or begin RFP process.",
            })

    # Diversification opportunity
    low_diversity_depts = [d for d in dept_opportunities if d["unique_vendors"] <= 3 and d["expiring"] > 0]
    if low_diversity_depts:
        dept = low_diversity_depts[0]
        recommendations.append({
            "priority": "high",
            "action": f"Diversify vendor pool in {dept['department']}",
            "detail": f"Only {dept['unique_vendors']} vendor(s) serve this department with {_fmt_currency(dept['expiring_value'])} expiring soon. "
                      f"Low competition increases price risk and creates single-point-of-failure.",
            "next_step": "Research MBE-certified and small business vendors in this category. Add to bid list for upcoming renewals.",
        })

    # Quick win
    mid_value_expiring = [c for c in expiring_high if 500000 <= c["value"] <= 5000000 and c["days_to_expiry"] > 60]
    if mid_value_expiring:
        c = mid_value_expiring[0]
        recommendations.append({
            "priority": "medium",
            "action": f"Quick win: Rebid {c['supplier']} ({_fmt_currency(c['value'])})",
            "detail": f"Contract {c['contract_number']} in {c['department']} expires in {c['days_to_expiry']} days. "
                      f"Mid-value contracts are easiest to rebid competitively with the most time to act.",
            "next_step": "Pull comparable contracts from eVA/VITA state listings. Compare pricing before renewal.",
        })

    # Overall portfolio insight
    if dept_opportunities:
        total_expiring_value = sum(d["expiring_value"] for d in dept_opportunities)
        recommendations.append({
            "priority": "info",
            "action": f"Portfolio overview: {_fmt_currency(total_expiring_value)} in contracts expiring within 6 months",
            "detail": f"Across {len(dept_opportunities)} departments, {sum(d['expiring'] for d in dept_opportunities)} contracts "
                      f"need attention. Proactive rebidding at even 5% savings yields {_fmt_currency(total_expiring_value * 0.05)}.",
            "next_step": "Prioritize departments by expiring value. Start with highest-value departments first.",
        })

    return {
        "concentrated_contracts": concentrated,
        "expiring_high_value": expiring_high,
        "scenarios": {
            "conservative": {"rate": "5%", "savings": conservative_savings, "label": "Conservative — minimal competitive pressure"},
            "moderate": {"rate": "10%", "savings": moderate_savings, "label": "Moderate — active rebid with 3+ vendors"},
            "aggressive": {"rate": "15%", "savings": aggressive_savings, "label": "Aggressive — full competitive procurement"},
        },
        "total_at_risk": all_values,
        "department_opportunities": dept_opportunities,
        "recommendations": recommendations,
    }


# ---------------------------------------------------------------------------
# Portfolio Strategy Advisor
# ---------------------------------------------------------------------------

@router.get("/portfolio")
def portfolio_strategy() -> Dict[str, Any]:
    """Department-level procurement strategy recommendations."""

    departments = query("""
        SELECT department,
               COUNT(*) AS total_contracts,
               SUM(value) AS total_value,
               SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END) AS critical,
               SUM(CASE WHEN risk_level = 'warning' THEN 1 ELSE 0 END) AS warning,
               SUM(CASE WHEN risk_level = 'expired' THEN 1 ELSE 0 END) AS expired,
               SUM(CASE WHEN risk_level = 'ok' THEN 1 ELSE 0 END) AS ok,
               SUM(CASE WHEN days_to_expiry BETWEEN 1 AND 90 THEN value ELSE 0 END) AS urgent_value,
               COUNT(DISTINCT supplier) AS unique_vendors,
               ROUND(COUNT(DISTINCT supplier) * 1.0 / NULLIF(COUNT(*), 0), 2) AS diversity_ratio
        FROM city_contracts
        GROUP BY department
        HAVING COUNT(*) >= 5
        ORDER BY total_value DESC
    """)

    # Get top vendor per department for specific recommendations
    top_vendors_by_dept = query("""
        WITH ranked AS (
            SELECT department, supplier, SUM(value) AS vendor_value,
                   COUNT(*) AS vendor_contracts,
                   ROW_NUMBER() OVER (PARTITION BY department ORDER BY SUM(value) DESC) AS rn
            FROM city_contracts
            GROUP BY department, supplier
        )
        SELECT department, supplier, vendor_value, vendor_contracts
        FROM ranked WHERE rn = 1
    """)
    top_vendor_map = {r["department"]: r for r in top_vendors_by_dept}

    strategies: List[Dict[str, Any]] = []
    total_projected_savings = 0

    for dept in departments:
        total = dept["total_contracts"]
        at_risk = dept["critical"] + dept["expired"]
        at_risk_pct = at_risk / max(total, 1)
        diversity = dept["diversity_ratio"]

        renew_count = dept["ok"]
        rebid_count = dept["critical"] + dept["warning"]
        escalate_count = dept["expired"]

        rebid_value = dept["urgent_value"]
        projected_savings = round(rebid_value * 0.08)
        total_projected_savings += projected_savings

        top_vendor = top_vendor_map.get(dept["department"], {})
        top_vendor_name = top_vendor.get("supplier", "Unknown")
        top_vendor_value = top_vendor.get("vendor_value", 0)
        top_vendor_contracts = top_vendor.get("vendor_contracts", 0)

        # Generate specific action items
        actions: List[Dict[str, str]] = []

        if escalate_count > 0:
            actions.append({
                "type": "escalate",
                "text": f"Review {escalate_count} expired contract(s) immediately — these are operating without valid agreements.",
            })

        if rebid_count > 0 and rebid_value > 0:
            actions.append({
                "type": "rebid",
                "text": f"Initiate competitive rebid for {rebid_count} expiring contract(s) worth {_fmt_currency(rebid_value)}. "
                        f"Target {_fmt_currency(projected_savings)} in savings.",
            })

        if top_vendor_value > 0 and total > 0:
            vendor_share = top_vendor_value / max(dept["total_value"], 1) * 100
            if vendor_share > 40:
                actions.append({
                    "type": "diversify",
                    "text": f"Reduce dependency on {top_vendor_name} ({vendor_share:.0f}% of dept spend, "
                            f"{top_vendor_contracts} contracts, {_fmt_currency(top_vendor_value)}). "
                            f"Seek alternative vendors for next renewal cycle.",
                })

        if diversity < 0.3:
            actions.append({
                "type": "equity",
                "text": f"Only {dept['unique_vendors']} vendor(s) serve this department. "
                        f"Actively recruit MBE-certified and small business vendors to improve competition and equity.",
            })

        if renew_count > 0 and at_risk_pct < 0.15:
            actions.append({
                "type": "renew",
                "text": f"Renew {renew_count} healthy contract(s). Portfolio is in good shape — maintain current vendor relationships.",
            })

        # Risk level
        if at_risk_pct > 0.30:
            risk = "high"
            summary = f"Critical: {at_risk} of {total} contracts at risk. Immediate portfolio review needed."
        elif at_risk_pct > 0.15:
            risk = "medium"
            summary = f"Attention: {rebid_count} contracts need rebid this quarter. {_fmt_currency(projected_savings)} potential savings."
        else:
            risk = "low"
            summary = f"Healthy: {renew_count} of {total} contracts in good standing. Monitor {dept['warning']} upcoming."

        # Diversity recommendation
        if diversity < 0.3:
            diversity_note = "Low vendor diversity — actively seek MBE/small business alternatives."
        elif diversity < 0.6:
            diversity_note = "Moderate diversity — consider expanding vendor pool for upcoming rebids."
        else:
            diversity_note = "Strong vendor diversity."

        strategies.append({
            "department": dept["department"],
            "total_contracts": total,
            "total_value": dept["total_value"],
            "breakdown": {"renew": renew_count, "rebid": rebid_count, "escalate": escalate_count},
            "projected_savings": projected_savings,
            "risk_level": risk,
            "summary": summary,
            "actions": actions,
            "top_vendor": top_vendor_name,
            "top_vendor_value": top_vendor_value,
            "top_vendor_share": round(top_vendor_value / max(dept["total_value"], 1) * 100, 1),
            "diversity_ratio": diversity,
            "diversity_note": diversity_note,
            "unique_vendors": dept["unique_vendors"],
        })

    # Portfolio-wide insights
    high_risk_depts = [s for s in strategies if s["risk_level"] == "high"]
    low_div_depts = [s for s in strategies if s["diversity_ratio"] < 0.3]
    total_rebid = sum(s["breakdown"]["rebid"] for s in strategies)
    total_escalate = sum(s["breakdown"]["escalate"] for s in strategies)

    portfolio_insights = []
    if high_risk_depts:
        names = ", ".join(s["department"] or "Unknown" for s in high_risk_depts[:3])
        portfolio_insights.append(f"Priority departments: {names} — highest concentration of at-risk contracts.")
    if total_escalate > 0:
        portfolio_insights.append(f"{total_escalate} contracts are expired and operating without valid agreements. Address these first.")
    if total_rebid > 0:
        portfolio_insights.append(f"{total_rebid} contracts recommended for competitive rebid, with {_fmt_currency(total_projected_savings)} in projected savings.")
    if low_div_depts:
        portfolio_insights.append(f"{len(low_div_depts)} department(s) have critically low vendor diversity — equity and competition risk.")

    return {
        "strategies": strategies,
        "total_projected_savings": total_projected_savings,
        "departments_analyzed": len(strategies),
        "portfolio_insights": portfolio_insights,
    }


# ---------------------------------------------------------------------------
# Decision Audit Timeline
# ---------------------------------------------------------------------------

@router.get("/timeline")
def decision_timeline() -> Dict[str, Any]:
    """Return all AI decisions as a timeline for institutional memory."""

    decisions = query("""
        SELECT id, contract_number, supplier, department, contract_value,
               verdict, confidence, summary,
               CAST(created_at AS VARCHAR) AS created_at
        FROM decisions
        ORDER BY created_at DESC
        LIMIT 100
    """)

    # Stats
    total = len(decisions)
    verdicts = {"RENEW": 0, "REBID": 0, "ESCALATE": 0, "STAFF": 0}
    dept_counts: Dict[str, int] = {}
    total_value_analyzed = 0
    vendor_counts: Dict[str, int] = {}

    for d in decisions:
        v = d.get("verdict", "")
        if v in verdicts:
            verdicts[v] += 1
        dept = d.get("department", "Unknown")
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        total_value_analyzed += d.get("contract_value", 0) or 0
        supplier = d.get("supplier", "Unknown")
        vendor_counts[supplier] = vendor_counts.get(supplier, 0) + 1

    # Top departments by decision count
    top_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:8]

    # Generate insights from decision history
    insights: List[str] = []

    if total > 0:
        renew_pct = round(verdicts["RENEW"] / total * 100)
        rebid_pct = round(verdicts["REBID"] / total * 100)
        escalate_pct = round(verdicts["ESCALATE"] / total * 100)

        if renew_pct > 60:
            insights.append(f"{renew_pct}% of analyzed contracts recommended for renewal — portfolio is generally healthy.")
        elif rebid_pct > 40:
            insights.append(f"{rebid_pct}% of contracts flagged for rebid — significant competitive savings opportunity across the portfolio.")
        if escalate_pct > 20:
            insights.append(f"{escalate_pct}% require escalation — review compliance and vendor performance patterns.")

        # Most analyzed vendor
        if vendor_counts:
            top_vendor = max(vendor_counts.items(), key=lambda x: x[1])
            if top_vendor[1] > 1:
                insights.append(f"Most analyzed vendor: {top_vendor[0]} ({top_vendor[1]} decisions). Consider bulk strategy for this vendor's contracts.")

        # Department coverage
        total_depts_in_system = len(query("SELECT DISTINCT department FROM city_contracts"))
        coverage = round(len(dept_counts) / max(total_depts_in_system, 1) * 100)
        insights.append(f"Decision coverage: {len(dept_counts)} of {total_depts_in_system} departments analyzed ({coverage}%).")

        if total_value_analyzed > 0:
            insights.append(f"Total contract value reviewed: {_fmt_currency(total_value_analyzed)} — building institutional knowledge for data-driven procurement.")

        # Recommend next action
        unanalyzed = query("""
            SELECT department, COUNT(*) AS cnt, SUM(value) AS total_value
            FROM city_contracts
            WHERE risk_level IN ('critical', 'expired')
              AND contract_number NOT IN (SELECT contract_number FROM decisions)
            GROUP BY department
            ORDER BY total_value DESC
            LIMIT 1
        """)
        if unanalyzed:
            dept = unanalyzed[0]
            insights.append(f"Next priority: {dept['department']} has {dept['cnt']} critical/expired contracts ({_fmt_currency(dept['total_value'])}) not yet analyzed.")

    return {
        "decisions": decisions,
        "total": total,
        "verdict_breakdown": verdicts,
        "total_value_analyzed": total_value_analyzed,
        "top_departments": [{"department": d, "count": c} for d, c in top_depts],
        "insights": insights,
    }
