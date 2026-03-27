"""
Contracts router — all /api/contracts endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.db import query
from app.schemas import (
    Contract,
    ContractsResponse,
    StatsResponse,
    DepartmentStat,
    VendorStat,
    VendorDetail,
)

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


# ---------------------------------------------------------------------------
# GET /api/contracts
# ---------------------------------------------------------------------------

@router.get("", response_model=ContractsResponse)
def list_contracts(
    department: Optional[str] = Query(default=None),
    risk_level: Optional[str] = Query(default=None),
    min_value: Optional[float] = Query(default=None),
    max_days: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=2000),
    offset: int = Query(default=0, ge=0),
) -> ContractsResponse:
    """List contracts with optional filters, paginated."""
    where_clauses: List[str] = []
    params: List = []

    if department is not None:
        where_clauses.append("department = ?")
        params.append(department)

    if risk_level is not None:
        where_clauses.append("risk_level = ?")
        params.append(risk_level)

    if min_value is not None:
        where_clauses.append("value >= ?")
        params.append(min_value)

    if max_days is not None:
        where_clauses.append("days_to_expiry BETWEEN 0 AND ?")
        params.append(max_days)

    if search is not None:
        where_clauses.append(
            "(description ILIKE ? OR supplier ILIKE ?)"
        )
        like_term = f"%{search}%"
        params.extend([like_term, like_term])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    count_sql = f"SELECT COUNT(*) AS total FROM city_contracts {where_sql}"
    total_row = query(count_sql, params or None)
    total = total_row[0]["total"] if total_row else 0

    data_sql = f"""
        SELECT
            department,
            contract_number,
            value,
            supplier,
            procurement_type,
            description,
            solicitation_type,
            CAST(start_date AS VARCHAR) AS start_date,
            CAST(end_date AS VARCHAR) AS end_date,
            days_to_expiry,
            risk_level
        FROM city_contracts
        {where_sql}
        ORDER BY
            CASE WHEN days_to_expiry >= 0 THEN 0 ELSE 1 END,
            days_to_expiry ASC NULLS LAST
        LIMIT ? OFFSET ?
    """
    data_params = (params or []) + [limit, offset]
    rows = query(data_sql, data_params)
    contracts = [Contract(**row) for row in rows]

    return ContractsResponse(contracts=contracts, total=total)


# ---------------------------------------------------------------------------
# GET /api/contracts/stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=StatsResponse)
def get_stats() -> StatsResponse:
    """Aggregate statistics across all contracts."""

    # Totals
    totals = query(
        "SELECT COUNT(*) AS total_contracts, SUM(value) AS total_value FROM city_contracts"
    )
    total_contracts = totals[0]["total_contracts"] if totals else 0
    total_value = totals[0]["total_value"] if totals else None

    # Expiring counts
    exp30_rows = query(
        "SELECT COUNT(*) AS cnt FROM city_contracts WHERE days_to_expiry >= 0 AND days_to_expiry <= 30"
    )
    exp60_rows = query(
        "SELECT COUNT(*) AS cnt FROM city_contracts WHERE days_to_expiry >= 0 AND days_to_expiry <= 60"
    )
    exp90_rows = query(
        "SELECT COUNT(*) AS cnt FROM city_contracts WHERE days_to_expiry >= 0 AND days_to_expiry <= 90"
    )
    expiring_30 = exp30_rows[0]["cnt"] if exp30_rows else 0
    expiring_60 = exp60_rows[0]["cnt"] if exp60_rows else 0
    expiring_90 = exp90_rows[0]["cnt"] if exp90_rows else 0

    # Departments
    dept_rows = query(
        """
        SELECT department, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts
        GROUP BY department
        ORDER BY count DESC
        """
    )
    departments = [
        DepartmentStat(
            department=r["department"],
            count=r["count"],
            total_value=r["total_value"],
        )
        for r in dept_rows
    ]

    # Top 20 vendors
    vendor_rows = query(
        """
        SELECT supplier, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts
        GROUP BY supplier
        ORDER BY count DESC
        LIMIT 20
        """
    )
    top_vendors = [
        VendorStat(
            supplier=r["supplier"],
            count=r["count"],
            total_value=r["total_value"],
        )
        for r in vendor_rows
    ]

    return StatsResponse(
        total_contracts=total_contracts,
        total_value=total_value,
        expiring_30=expiring_30,
        expiring_60=expiring_60,
        expiring_90=expiring_90,
        departments=departments,
        top_vendors=top_vendors,
    )


# ---------------------------------------------------------------------------
# GET /api/contracts/departments
# ---------------------------------------------------------------------------

@router.get("/departments", response_model=List[Optional[str]])
def list_departments() -> List[Optional[str]]:
    """Return distinct department names sorted alphabetically."""
    rows = query(
        "SELECT DISTINCT department FROM city_contracts ORDER BY department ASC NULLS LAST"
    )
    return [r["department"] for r in rows]


# ---------------------------------------------------------------------------
# GET /api/contracts/vendor/{supplier}
# ---------------------------------------------------------------------------

@router.get("/vendor/{supplier}", response_model=VendorDetail)
def vendor_detail(supplier: str) -> VendorDetail:
    """All contracts for a specific vendor plus aggregated stats."""
    rows = query(
        """
        SELECT
            department,
            contract_number,
            value,
            supplier,
            procurement_type,
            description,
            solicitation_type,
            CAST(start_date AS VARCHAR) AS start_date,
            CAST(end_date AS VARCHAR) AS end_date,
            days_to_expiry,
            risk_level
        FROM city_contracts
        WHERE supplier = ?
        ORDER BY
            CASE WHEN days_to_expiry >= 0 THEN 0 ELSE 1 END,
            days_to_expiry ASC NULLS LAST
        """,
        [supplier],
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"Vendor '{supplier}' not found")

    contracts = [Contract(**r) for r in rows]

    agg = query(
        """
        SELECT
            COUNT(*) AS count,
            SUM(value) AS total_value,
            CAST(MIN(start_date) AS VARCHAR) AS first_contract,
            CAST(MAX(end_date) AS VARCHAR) AS last_expiry
        FROM city_contracts
        WHERE supplier = ?
        """,
        [supplier],
    )
    agg_row = agg[0] if agg else {}

    dept_rows = query(
        "SELECT DISTINCT department FROM city_contracts WHERE supplier = ? ORDER BY department ASC NULLS LAST",
        [supplier],
    )
    departments_served = [r["department"] for r in dept_rows]

    return VendorDetail(
        contracts=contracts,
        count=agg_row.get("count", len(contracts)),
        total_value=agg_row.get("total_value"),
        first_contract=agg_row.get("first_contract"),
        last_expiry=agg_row.get("last_expiry"),
        departments_served=departments_served,
    )


# ---------------------------------------------------------------------------
# GET /api/contracts/{contract_number}
# ---------------------------------------------------------------------------

@router.get("/{contract_number}", response_model=Contract)
def get_contract(contract_number: str) -> Contract:
    """Retrieve a single contract by contract number."""
    rows = query(
        """
        SELECT
            department,
            contract_number,
            value,
            supplier,
            procurement_type,
            description,
            solicitation_type,
            CAST(start_date AS VARCHAR) AS start_date,
            CAST(end_date AS VARCHAR) AS end_date,
            days_to_expiry,
            risk_level
        FROM city_contracts
        WHERE contract_number = ?
        """,
        [contract_number],
    )
    if not rows:
        raise HTTPException(
            status_code=404, detail=f"Contract '{contract_number}' not found"
        )
    return Contract(**rows[0])
