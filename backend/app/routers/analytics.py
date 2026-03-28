"""Analytics endpoints for spending trends and timeline data."""

from fastapi import APIRouter
from app.db import query

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/spending-by-year")
def spending_by_year():
    """Year-over-year spending trends based on contract start dates."""
    rows = query("""
        SELECT
            EXTRACT(YEAR FROM start_date)::INTEGER AS year,
            COUNT(*) AS contract_count,
            SUM(value) AS total_value,
            AVG(value) AS avg_value
        FROM city_contracts
        WHERE start_date IS NOT NULL AND EXTRACT(YEAR FROM start_date) >= 2011
        GROUP BY year
        ORDER BY year
    """)
    return {"data": rows}


@router.get("/expiry-timeline")
def expiry_timeline():
    """Contracts expiring over the next 12 months, grouped by month."""
    rows = query("""
        SELECT
            DATE_TRUNC('month', end_date)::VARCHAR AS month,
            COUNT(*) AS count,
            SUM(value) AS total_value
        FROM city_contracts
        WHERE days_to_expiry BETWEEN 0 AND 365
        GROUP BY DATE_TRUNC('month', end_date)
        ORDER BY month
    """)
    return {"data": rows}


@router.get("/spending-by-type")
def spending_by_type():
    """Spending breakdown by procurement type."""
    rows = query("""
        SELECT
            procurement_type,
            COUNT(*) AS count,
            SUM(value) AS total_value
        FROM city_contracts
        WHERE procurement_type IS NOT NULL AND procurement_type != ''
        GROUP BY procurement_type
        ORDER BY total_value DESC
    """)
    return {"data": rows}


@router.get("/contract-size-distribution")
def contract_size_distribution():
    """Distribution of contract values by size bucket."""
    rows = query("""
        SELECT
            CASE
                WHEN value < 50000 THEN 'Under $50K'
                WHEN value < 100000 THEN '$50K - $100K'
                WHEN value < 500000 THEN '$100K - $500K'
                WHEN value < 1000000 THEN '$500K - $1M'
                WHEN value < 5000000 THEN '$1M - $5M'
                WHEN value < 10000000 THEN '$5M - $10M'
                ELSE 'Over $10M'
            END AS bucket,
            CASE
                WHEN value < 50000 THEN 1
                WHEN value < 100000 THEN 2
                WHEN value < 500000 THEN 3
                WHEN value < 1000000 THEN 4
                WHEN value < 5000000 THEN 5
                WHEN value < 10000000 THEN 6
                ELSE 7
            END AS sort_order,
            COUNT(*) AS count,
            SUM(value) AS total_value
        FROM city_contracts
        WHERE value IS NOT NULL AND value > 0
        GROUP BY bucket, sort_order
        ORDER BY sort_order
    """)
    return {"data": rows}


@router.get("/monthly-activity")
def monthly_activity():
    """Contract starts and expirations by month for heatmap."""
    starts = query("""
        SELECT DATE_TRUNC('month', start_date)::VARCHAR AS month, COUNT(*) AS starts
        FROM city_contracts WHERE start_date IS NOT NULL
        GROUP BY DATE_TRUNC('month', start_date) ORDER BY month
    """)
    ends = query("""
        SELECT DATE_TRUNC('month', end_date)::VARCHAR AS month, COUNT(*) AS expirations
        FROM city_contracts WHERE end_date IS NOT NULL
        GROUP BY DATE_TRUNC('month', end_date) ORDER BY month
    """)
    return {"starts": starts, "expirations": ends}


@router.get("/department-scorecards")
def department_scorecards():
    """Per-department summary scorecards."""
    return {"scorecards": query("""
        SELECT
            department,
            COUNT(*) AS total_contracts,
            SUM(value) AS total_value,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS expiring_30,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 90 THEN 1 ELSE 0 END) AS expiring_90,
            COUNT(DISTINCT supplier) AS unique_vendors,
            ROUND(AVG(value), 0) AS avg_contract_value,
            MAX(value) AS largest_contract
        FROM city_contracts
        WHERE department IS NOT NULL
        GROUP BY department
        ORDER BY total_value DESC
    """)}


@router.get("/vendor-price-trend/{supplier}")
def vendor_price_trend(supplier: str):
    """Show how a vendor's contract values have changed over time."""
    contracts = query(
        """SELECT CAST(start_date AS VARCHAR) AS start_date, value, contract_number, description
        FROM city_contracts WHERE supplier = ? AND value > 0 AND start_date IS NOT NULL
        ORDER BY start_date""",
        [supplier],
    )

    # Calculate department average for comparison
    if contracts:
        dept = query("SELECT department FROM city_contracts WHERE supplier = ? LIMIT 1", [supplier])
        dept_name = dept[0]["department"] if dept else None
        dept_avg = None
        if dept_name:
            avg_row = query("SELECT AVG(value) AS avg_val FROM city_contracts WHERE department = ? AND value > 0", [dept_name])
            dept_avg = avg_row[0]["avg_val"] if avg_row else None
    else:
        dept_name = None
        dept_avg = None

    # Price change calculation
    if len(contracts) >= 2:
        first_val = contracts[0]["value"]
        last_val = contracts[-1]["value"]
        pct_change = ((last_val - first_val) / first_val * 100) if first_val > 0 else 0
    else:
        pct_change = 0

    return {
        "supplier": supplier,
        "contracts": contracts,
        "total_contracts": len(contracts),
        "department_average": dept_avg,
        "department": dept_name,
        "price_change_pct": round(pct_change, 1),
        "first_value": contracts[0]["value"] if contracts else None,
        "latest_value": contracts[-1]["value"] if contracts else None,
    }


@router.get("/cost-comparison/{department}")
def cost_comparison(department: str):
    """Compare vendors within a department by average contract value."""
    vendors = query(
        """SELECT supplier, COUNT(*) AS count, AVG(value) AS avg_value, SUM(value) AS total_value,
           MIN(value) AS min_value, MAX(value) AS max_value
        FROM city_contracts WHERE department = ? AND value > 0
        GROUP BY supplier HAVING COUNT(*) >= 2
        ORDER BY avg_value DESC LIMIT 15""",
        [department],
    )
    dept_avg = query("SELECT AVG(value) AS avg_val FROM city_contracts WHERE department = ? AND value > 0", [department])
    return {
        "department": department,
        "vendors": vendors,
        "department_average": dept_avg[0]["avg_val"] if dept_avg else 0,
    }
