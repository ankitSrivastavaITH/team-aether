"""MBE vendor analysis and contract anomaly detection."""

from typing import Any, Dict, List
from fastapi import APIRouter
from app.db import query

router = APIRouter(prefix="/api/mbe", tags=["mbe"])


@router.get("/analysis")
def mbe_analysis() -> Dict[str, Any]:
    """Analyze MBE participation in city contracts.
    Note: The City Contracts dataset doesn't explicitly flag MBE status.
    We identify potential MBE-relevant patterns and flag opportunities."""

    # Small business indicators (contracts under $500K — typical MBE range)
    small_contracts = query("""
        SELECT COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts WHERE value > 0 AND value < 500000
    """)

    all_contracts = query("""
        SELECT COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts WHERE value > 0
    """)

    # Vendor diversity by department
    dept_diversity = query("""
        SELECT department,
            COUNT(DISTINCT supplier) AS unique_vendors,
            COUNT(*) AS total_contracts,
            ROUND(COUNT(DISTINCT supplier) * 100.0 / COUNT(*), 1) AS diversity_ratio
        FROM city_contracts
        WHERE value > 0
        GROUP BY department
        ORDER BY diversity_ratio ASC
        LIMIT 10
    """)

    # Single-contract vendors (potential small/MBE businesses)
    single_vendors = query("""
        SELECT COUNT(*) AS count
        FROM (
            SELECT supplier FROM city_contracts
            GROUP BY supplier HAVING COUNT(*) = 1
        )
    """)

    total_vendors = query("SELECT COUNT(DISTINCT supplier) AS count FROM city_contracts")

    # Procurement type distribution (competitive vs sole source)
    procurement_types = query("""
        SELECT procurement_type, COUNT(*) AS count, SUM(value) AS total_value,
            ROUND(SUM(value) * 100.0 / (SELECT SUM(value) FROM city_contracts WHERE value > 0), 1) AS pct_value
        FROM city_contracts
        WHERE value > 0 AND procurement_type IS NOT NULL
        GROUP BY procurement_type
        ORDER BY total_value DESC
    """)

    # Contracts using competitive bidding (more accessible to MBEs)
    competitive = query("""
        SELECT COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts
        WHERE procurement_type = 'Invitation to Bid' AND value > 0
    """)

    return {
        "small_business_contracts": small_contracts[0] if small_contracts else {},
        "all_contracts": all_contracts[0] if all_contracts else {},
        "department_diversity": dept_diversity,
        "single_contract_vendors": single_vendors[0]["count"] if single_vendors else 0,
        "total_unique_vendors": total_vendors[0]["count"] if total_vendors else 0,
        "procurement_types": procurement_types,
        "competitive_bidding": competitive[0] if competitive else {},
        "insights": [
            "Departments with low vendor diversity may have barriers to MBE participation",
            "Small contracts under $500K are typically most accessible to minority-owned businesses",
            "Competitive bidding (Invitation to Bid) provides the most open access for new vendors",
            "Single-contract vendors may represent small businesses that could benefit from more opportunities",
        ],
        "disclaimer": "MBE status cannot be determined from public contract data alone. This analysis identifies patterns relevant to supplier diversity.",
    }


@router.get("/anomalies")
def contract_anomalies() -> Dict[str, Any]:
    """Detect anomalies and unusual patterns in contract data."""

    anomalies: List[Dict[str, Any]] = []

    # 1. Contracts with $0 value
    zero_value = query("""
        SELECT COUNT(*) AS count FROM city_contracts WHERE value = 0 OR value IS NULL
    """)
    if zero_value and zero_value[0]["count"] > 0:
        anomalies.append({
            "type": "zero_value",
            "severity": "medium",
            "title": "Contracts with $0 or missing value",
            "count": zero_value[0]["count"],
            "description": f"{zero_value[0]['count']} contracts have zero or missing dollar values, making spending analysis incomplete.",
            "recommendation": "Review these contracts to determine if values are missing or if they are zero-cost agreements.",
        })

    # 2. Expired contracts still in active data
    long_expired = query("""
        SELECT COUNT(*) AS count, MIN(days_to_expiry) AS oldest
        FROM city_contracts WHERE days_to_expiry < -365
    """)
    if long_expired and long_expired[0]["count"] > 0:
        anomalies.append({
            "type": "long_expired",
            "severity": "high",
            "title": "Contracts expired over 1 year ago",
            "count": long_expired[0]["count"],
            "description": f"{long_expired[0]['count']} contracts expired more than a year ago but remain in the registry. The oldest expired {abs(long_expired[0]['oldest'])} days ago.",
            "recommendation": "Archive or close these contracts. Verify no active spending against expired terms.",
        })

    # 3. High-concentration vendors across departments
    single_source = query("""
        SELECT department, supplier, COUNT(*) AS contracts, SUM(value) AS total_value
        FROM city_contracts
        WHERE value > 0
        GROUP BY department, supplier
        HAVING COUNT(*) > 5
        AND supplier IN (
            SELECT supplier FROM city_contracts
            GROUP BY supplier
            HAVING SUM(value) > 10000000
        )
        ORDER BY total_value DESC
        LIMIT 5
    """)
    for ss in single_source:
        anomalies.append({
            "type": "high_concentration",
            "severity": "medium",
            "title": f"High vendor concentration: {ss['supplier']}",
            "count": ss["contracts"],
            "description": f"{ss['supplier']} holds {ss['contracts']} contracts worth ${ss['total_value']:,.0f} in {ss['department']}.",
            "recommendation": "Consider whether competitive alternatives exist for future procurements.",
        })

    # 4. Contracts with very long terms (>5 years)
    long_term = query("""
        SELECT COUNT(*) AS count,
            MAX(CAST(end_date AS DATE) - CAST(start_date AS DATE)) AS max_days
        FROM city_contracts
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
        AND (CAST(end_date AS DATE) - CAST(start_date AS DATE)) > 1825
    """)
    if long_term and long_term[0]["count"] > 0:
        anomalies.append({
            "type": "long_term",
            "severity": "low",
            "title": "Contracts with terms exceeding 5 years",
            "count": long_term[0]["count"],
            "description": f"{long_term[0]['count']} contracts span more than 5 years. Longest: {long_term[0]['max_days']} days ({long_term[0]['max_days']//365} years).",
            "recommendation": "Review long-term contracts for price competitiveness and renewal opportunities.",
        })

    # 5. Price outliers (contracts >3x department average)
    outliers = query("""
        WITH dept_avg AS (
            SELECT department, AVG(value) AS avg_value, STDDEV(value) AS std_value
            FROM city_contracts WHERE value > 0
            GROUP BY department HAVING COUNT(*) >= 5
        )
        SELECT c.department, c.supplier, c.value, c.contract_number,
            da.avg_value,
            ROUND((c.value - da.avg_value) / NULLIF(da.std_value, 0), 1) AS z_score
        FROM city_contracts c
        JOIN dept_avg da ON c.department = da.department
        WHERE c.value > da.avg_value * 3 AND c.value > 1000000
        ORDER BY c.value DESC
        LIMIT 5
    """)
    for o in outliers:
        anomalies.append({
            "type": "price_outlier",
            "severity": "medium",
            "title": f"Outlier: {o['supplier']} — ${o['value']:,.0f}",
            "count": 1,
            "description": f"Contract #{o['contract_number']} in {o['department']} is ${o['value']:,.0f}, which is {o['z_score']}x standard deviations above the department average of ${o['avg_value']:,.0f}.",
            "recommendation": "Verify this contract was competitively bid and represents fair market value.",
        })

    # Sort by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    anomalies.sort(key=lambda a: severity_order.get(a["severity"], 3))

    return {
        "anomalies": anomalies,
        "total": len(anomalies),
        "disclaimer": "Anomalies are statistical patterns, not compliance findings. All require human review.",
    }
