"""
Pydantic schemas for the RVA Contract Lens API.
"""

from typing import List, Optional
from pydantic import BaseModel


class Contract(BaseModel):
    department: Optional[str] = None
    contract_number: Optional[str] = None
    value: Optional[float] = None
    supplier: Optional[str] = None
    procurement_type: Optional[str] = None
    description: Optional[str] = None
    solicitation_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    days_to_expiry: Optional[int] = None
    risk_level: Optional[str] = None


class ContractsResponse(BaseModel):
    contracts: List[Contract]
    total: int


class DepartmentStat(BaseModel):
    department: Optional[str] = None
    count: int
    total_value: Optional[float] = None


class VendorStat(BaseModel):
    supplier: Optional[str] = None
    count: int
    total_value: Optional[float] = None


class StatsResponse(BaseModel):
    total_contracts: int
    total_value: Optional[float] = None
    expiring_30: int
    expiring_60: int
    expiring_90: int
    departments: List[DepartmentStat]
    top_vendors: List[VendorStat]


class VendorDetail(BaseModel):
    contracts: List[Contract]
    count: int
    total_value: Optional[float] = None
    first_contract: Optional[str] = None
    last_expiry: Optional[str] = None
    departments_served: List[Optional[str]]
