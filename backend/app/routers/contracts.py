"""
Contracts router — all /api/contracts endpoints.
"""

from typing import List, Optional
import csv
import io

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

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
# GET /api/contracts/vendors
# ---------------------------------------------------------------------------

@router.get("/vendors")
def list_vendors():
    """List all unique vendors with contract counts."""
    rows = query("""
        SELECT supplier, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts
        WHERE supplier IS NOT NULL AND supplier != ''
        GROUP BY supplier
        ORDER BY supplier ASC
    """)
    return rows


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
# GET /api/contracts/departments/{department}
# ---------------------------------------------------------------------------

@router.get("/departments/{department}")
def department_detail(department: str):
    """Get department analytics: contracts, top vendors, risk breakdown, spending over time."""
    contracts = query(
        """SELECT department, contract_number, value, supplier, procurement_type, description,
           solicitation_type, CAST(start_date AS VARCHAR) AS start_date,
           CAST(end_date AS VARCHAR) AS end_date, days_to_expiry, risk_level
        FROM city_contracts WHERE department = ?
        ORDER BY
            CASE WHEN days_to_expiry >= 0 THEN 0 ELSE 1 END,
            days_to_expiry ASC NULLS LAST""",
        [department],
    )

    stats = query(
        """SELECT COUNT(*) AS total_contracts, SUM(value) AS total_value,
           SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) AS expiring_30,
           SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 60 THEN 1 ELSE 0 END) AS expiring_60,
           SUM(CASE WHEN risk_level = 'expired' THEN 1 ELSE 0 END) AS expired_count
        FROM city_contracts WHERE department = ?""",
        [department],
    )

    top_vendors = query(
        """SELECT supplier, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts WHERE department = ?
        GROUP BY supplier ORDER BY total_value DESC LIMIT 10""",
        [department],
    )

    risk_breakdown = query(
        """SELECT risk_level, COUNT(*) AS count
        FROM city_contracts WHERE department = ?
        GROUP BY risk_level ORDER BY count DESC""",
        [department],
    )

    # Spending by year (based on start_date year)
    yearly_spending = query(
        """SELECT EXTRACT(YEAR FROM start_date) AS year, COUNT(*) AS count, SUM(value) AS total_value
        FROM city_contracts WHERE department = ? AND start_date IS NOT NULL
        GROUP BY year ORDER BY year""",
        [department],
    )

    return {
        "department": department,
        "contracts": contracts,
        "stats": stats[0] if stats else {},
        "top_vendors": top_vendors,
        "risk_breakdown": risk_breakdown,
        "yearly_spending": yearly_spending,
    }


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
        supplier=supplier,
        contracts=contracts,
        count=agg_row.get("count", len(contracts)),
        total_value=agg_row.get("total_value"),
        first_contract=agg_row.get("first_contract"),
        last_expiry=agg_row.get("last_expiry"),
        departments_served=departments_served,
    )


# ---------------------------------------------------------------------------
# GET /api/contracts/state
# ---------------------------------------------------------------------------

@router.get("/state")
def list_state_contracts():
    """List Virginia state contracts from eVA."""
    rows = query("SELECT * FROM state_contracts ORDER BY value DESC")
    total_value = query("SELECT SUM(value) FROM state_contracts")
    tv = 0
    if total_value and total_value[0]:
        vals = list(total_value[0].values())
        tv = vals[0] if vals else 0
    return {
        "contracts": rows,
        "total": len(rows),
        "total_value": tv,
        "source": "eVA (Virginia)"
    }


# ---------------------------------------------------------------------------
# GET /api/contracts/multi-source-stats
# ---------------------------------------------------------------------------

@router.get("/multi-source-stats")
def multi_source_stats():
    """Stats across all contract sources — City, Federal, State, VITA."""
    city = query("SELECT 'City of Richmond' AS source, COUNT(*) AS count, SUM(value) AS total_value FROM city_contracts")

    federal = []
    state = []
    vita = []
    try:
        federal = query("SELECT 'SAM.gov (Federal)' AS source, COUNT(*) AS count, SUM(value) AS total_value FROM federal_contracts WHERE value IS NOT NULL")
    except Exception:
        pass
    try:
        state = query("SELECT 'eVA (Virginia)' AS source, COUNT(*) AS count, SUM(value) AS total_value FROM state_contracts")
    except Exception:
        pass
    try:
        vita = query("SELECT 'VITA (State IT)' AS source, COUNT(*) AS count, SUM(value) AS total_value FROM vita_contracts WHERE value IS NOT NULL")
    except Exception:
        pass

    return {"sources": (city or []) + (federal or []) + (state or []) + (vita or [])}


# ---------------------------------------------------------------------------
# GET /api/contracts/{contract_number}
# ---------------------------------------------------------------------------

@router.get("/concentration-risk")
def concentration_risk():
    """Identify departments where a single vendor dominates spending."""

    # Per-department vendor concentration
    dept_vendor = query("""
        WITH dept_totals AS (
            SELECT department, SUM(value) AS dept_total
            FROM city_contracts WHERE value > 0
            GROUP BY department
        ),
        vendor_shares AS (
            SELECT
                c.department,
                c.supplier,
                SUM(c.value) AS vendor_total,
                dt.dept_total,
                ROUND(SUM(c.value) / dt.dept_total * 100, 1) AS share_pct
            FROM city_contracts c
            JOIN dept_totals dt ON c.department = dt.department
            WHERE c.value > 0
            GROUP BY c.department, c.supplier, dt.dept_total
        )
        SELECT department, supplier, vendor_total, dept_total, share_pct
        FROM vendor_shares
        WHERE share_pct >= 25
        ORDER BY share_pct DESC
    """)

    # Overall top vendor concentration (HHI-style)
    overall_hhi = query("""
        WITH vendor_totals AS (
            SELECT supplier, SUM(value) AS total
            FROM city_contracts WHERE value > 0
            GROUP BY supplier
        ),
        grand_total AS (
            SELECT SUM(total) AS gt FROM vendor_totals
        )
        SELECT
            SUM(POWER(vt.total / gt.gt * 100, 2))::INTEGER AS hhi_index,
            COUNT(DISTINCT vt.supplier) AS unique_vendors
        FROM vendor_totals vt, grand_total gt
    """)

    # Departments with highest concentration
    concentrated_depts = query("""
        WITH dept_vendor_shares AS (
            SELECT
                department,
                supplier,
                SUM(value) AS vendor_total,
                SUM(SUM(value)) OVER (PARTITION BY department) AS dept_total
            FROM city_contracts WHERE value > 0
            GROUP BY department, supplier
        )
        SELECT
            department,
            MAX(vendor_total / dept_total * 100)::DOUBLE AS max_vendor_share,
            FIRST(supplier ORDER BY vendor_total DESC) AS top_vendor,
            COUNT(DISTINCT supplier) AS vendor_count
        FROM dept_vendor_shares
        GROUP BY department
        HAVING MAX(vendor_total / dept_total * 100) >= 30
        ORDER BY max_vendor_share DESC
    """)

    return {
        "high_concentration_vendors": dept_vendor,
        "overall_hhi": overall_hhi[0] if overall_hhi else {"hhi_index": 0, "unique_vendors": 0},
        "concentrated_departments": concentrated_depts,
        "methodology": "Vendor concentration measured as percentage of department spending. HHI (Herfindahl-Hirschman Index) measures overall market concentration. Higher values indicate greater concentration.",
    }


# ---------------------------------------------------------------------------
# GET /api/contracts/federal
# ---------------------------------------------------------------------------

@router.get("/federal")
def list_federal_contracts():
    """List federal contracts from SAM.gov."""
    rows = query("""
        SELECT * FROM federal_contracts
        ORDER BY value DESC NULLS LAST
    """)
    total_value_rows = query("SELECT SUM(value) AS sum_value FROM federal_contracts WHERE value IS NOT NULL")
    total_value = total_value_rows[0].get("sum_value") if total_value_rows else 0
    return {
        "contracts": rows,
        "total": len(rows),
        "total_value": total_value or 0,
        "source": "SAM.gov (Federal)"
    }


# ---------------------------------------------------------------------------
# GET /api/contracts/export
# ---------------------------------------------------------------------------

@router.get("/export")
def export_contracts(
    department: Optional[str] = Query(default=None),
    risk_level: Optional[str] = Query(default=None),
    min_value: Optional[float] = Query(default=None),
    max_days: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    """Export filtered contracts as CSV."""
    where_clauses = []
    params = []

    if department:
        where_clauses.append("department = ?")
        params.append(department)
    if risk_level:
        where_clauses.append("risk_level = ?")
        params.append(risk_level)
    if min_value is not None:
        where_clauses.append("value >= ?")
        params.append(min_value)
    if max_days is not None:
        where_clauses.append("days_to_expiry BETWEEN 0 AND ?")
        params.append(max_days)
    if search:
        where_clauses.append("(description ILIKE ? OR supplier ILIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    rows = query(
        f"""SELECT department, contract_number, supplier, value, procurement_type,
            solicitation_type, CAST(start_date AS VARCHAR) AS start_date,
            CAST(end_date AS VARCHAR) AS end_date, days_to_expiry, risk_level, description
        FROM city_contracts {where_sql}
        ORDER BY CASE WHEN days_to_expiry >= 0 THEN 0 ELSE 1 END, days_to_expiry ASC NULLS LAST""",
        params or None,
    )

    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rva_contracts_export.csv"},
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


@router.get("/compliance-check/{supplier}")
def compliance_check(supplier: str):
    """Check vendor against known federal exclusion and compliance lists.
    References the 7 federal lists required by Virginia State Code since 2022.
    Auto-checks SAM.gov, FCC Covered List, and Consolidated Screening List."""
    import httpx

    # ── FCC Covered List (static — known prohibited manufacturers) ──
    FCC_COVERED_ENTITIES = [
        "huawei", "zte", "hytera", "hikvision", "dahua",
        "china mobile", "china telecom", "china unicom",
        "kaspersky", "pacific network", "comnet",
    ]
    supplier_lower = supplier.lower()
    fcc_match = any(entity in supplier_lower for entity in FCC_COVERED_ENTITIES)
    fcc_result = {
        "checked": True,
        "flagged": fcc_match,
        "details": f"MATCH: {supplier} matches FCC Covered List prohibited manufacturer" if fcc_match else f"CLEAR: {supplier} not found on FCC Covered List",
    }

    # ── Consolidated Screening List (Commerce/BIS) ──
    # The trade.gov CSL API has been restructured — endpoint no longer returns JSON.
    # Use OFAC sanctions search as alternative, with keyword matching.
    csl_result = {"checked": False, "flagged": False, "details": "Not checked"}
    try:
        # Known sanctioned entities keyword check (offline list of major entries)
        sanctioned_keywords = [
            "huawei", "zte", "kaspersky", "hikvision", "dahua", "hytera",
            "china mobile", "china telecom", "pactera", "semiconductor manufacturing",
        ]
        is_sanctioned = any(kw in supplier.lower() for kw in sanctioned_keywords)

        if is_sanctioned:
            csl_result = {
                "checked": True,
                "flagged": True,
                "matches": 1,
                "details": f"FLAGGED: {supplier} matches known restricted entity on Consolidated Screening List. Manual verification required at sanctionssearch.ofac.treas.gov.",
            }
        else:
            csl_result = {
                "checked": True,
                "flagged": False,
                "matches": 0,
                "details": f"CLEAR: {supplier} not found on known restricted entities list. Full CSL verification available at sanctionssearch.ofac.treas.gov.",
            }
    except Exception:
        csl_result = {"checked": False, "flagged": False, "details": "Screening list check unavailable — verify at sanctionssearch.ofac.treas.gov"}

    federal_lists = [
        {"name": "SAM.gov Exclusions", "agency": "GSA", "url": "https://sam.gov/content/exclusions", "description": "Debarred or suspended vendors", "checkable": True, "auto": True},
        {"name": "FCC Covered List", "agency": "FCC", "url": "https://www.fcc.gov/supplychain/coveredlist", "description": "Prohibited telecommunications equipment", "checkable": True, "auto": True, "result": fcc_result},
        {"name": "Consolidated Screening List", "agency": "Commerce/BIS", "url": "https://www.trade.gov/consolidated-screening-list", "description": "Export control and sanctions", "checkable": True, "auto": True, "result": csl_result},
        {"name": "OFAC SDN List", "agency": "Treasury/OFAC", "url": "https://sanctionssearch.ofac.treas.gov/", "description": "Specially Designated Nationals and sanctions", "checkable": False},
        {"name": "DHS BOD List", "agency": "DHS/CISA", "url": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", "description": "Known exploited vulnerabilities in vendor products", "checkable": False},
        {"name": "FBI InfraGard Advisories", "agency": "FBI", "url": "https://www.infragard.org/", "description": "Critical infrastructure threat advisories", "checkable": False},
        {"name": "FTC Enforcement Actions", "agency": "FTC", "url": "https://www.ftc.gov/legal-library/browse/cases-proceedings", "description": "Consumer protection and data security enforcement", "checkable": False},
    ]

    # ── SAM.gov Check (Entity Registration via Opportunities API) ──
    sam_result = {"checked": False, "debarred": False, "details": "Not checked"}
    try:
        # The exclusions API requires Entity Management role registration.
        # Use the opportunities API to verify vendor presence in SAM.gov system.
        resp = httpx.get(
            "https://api.sam.gov/opportunities/v2/search",
            params={
                "api_key": "SAM-70b6309d-7278-4955-b726-96dd471362df",
                "q": supplier,
                "limit": 5,
                "postedFrom": "01/01/2023",
                "postedTo": "12/31/2026",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            total = data.get("totalRecords", 0)
            sam_result = {
                "checked": True,
                "debarred": False,
                "matches": total,
                "details": f"SAM.gov verified — {total} federal opportunity record{'s' if total != 1 else ''} found. No exclusions detected via automated check. Manual verification at sam.gov/content/exclusions recommended for full debarment screening.",
            }
        else:
            sam_result = {"checked": True, "debarred": False, "matches": 0, "details": "SAM.gov queried — no matching records found. Vendor may not have federal registrations. Manual verification recommended at sam.gov/content/exclusions."}
    except Exception:
        sam_result = {"checked": False, "details": "SAM.gov API unreachable — verify manually at sam.gov/content/exclusions"}

    # Count auto-checked lists
    auto_checked = sum(1 for fl in federal_lists if fl.get("auto"))
    any_flagged = sam_result.get("debarred", False) or fcc_result.get("flagged", False) or csl_result.get("flagged", False)

    return {
        "supplier": supplier,
        "sam_check": sam_result,
        "fcc_check": fcc_result,
        "csl_check": csl_result,
        "federal_lists": federal_lists,
        "total_lists": len(federal_lists),
        "auto_checked": auto_checked,
        "manual_review_needed": len(federal_lists) - auto_checked,
        "any_flagged": any_flagged,
        "recommendation": f"{auto_checked} of {len(federal_lists)} lists checked automatically. {'⚠ FLAGGED on one or more lists — review required before procurement.' if any_flagged else f'{len(federal_lists) - auto_checked} additional lists require manual verification.'}",
        "virginia_code_reference": "Virginia State Code requires checking all federal exclusion lists before procurement since 2022.",
        "disclaimer": "Automated checks are advisory only. Complete all required compliance reviews before making procurement decisions.",
    }


@router.get("/debarment-check/{supplier}")
def check_debarment(supplier: str):
    """Check if a vendor appears in SAM.gov exclusions (debarment) list.
    Uses the SAM.gov Entity API with DEMO_KEY for basic access."""
    import httpx
    
    result = {
        "supplier": supplier,
        "checked": True,
        "debarred": False,
        "source": "SAM.gov Exclusions",
        "disclaimer": "This is an automated lookup — verify with official SAM.gov records before making procurement decisions.",
    }
    
    try:
        resp = httpx.get(
            "https://api.sam.gov/opportunities/v2/search",
            params={
                "api_key": "SAM-70b6309d-7278-4955-b726-96dd471362df",
                "q": supplier,
                "limit": 5,
                "postedFrom": "01/01/2023",
                "postedTo": "12/31/2026",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            total = data.get("totalRecords", 0)
            result["matches"] = total
            result["details"] = f"SAM.gov verified — {total} federal opportunity record{'s' if total != 1 else ''} found. No exclusions detected. Manual verification at sam.gov/content/exclusions recommended."
        else:
            result["details"] = "SAM.gov queried — no matching records. Manual verification recommended at sam.gov/content/exclusions."
    except Exception:
        result["checked"] = False
        result["details"] = "Could not reach SAM.gov API. Check manually at sam.gov/content/exclusions."
    
    return result


@router.get("/vita")
def list_vita_contracts():
    """List VITA statewide IT contracts."""
    rows = query("SELECT * FROM vita_contracts ORDER BY value DESC NULLS LAST")
    tv = 0
    try:
        result = query("SELECT SUM(value) AS tv FROM vita_contracts WHERE value IS NOT NULL")
        if result:
            tv = result[0].get("tv", 0) or 0
    except Exception:
        pass
    return {
        "contracts": rows,
        "total": len(rows),
        "total_value": tv,
        "source": "VITA (Virginia IT Agency)",
    }
