# RVA Contract Lens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dual-view civic tech app — staff procurement risk dashboard + public spending transparency explorer — using real Richmond contract data, in 48 hours.

**Architecture:** Next.js frontend with shadcn/ui, FastAPI backend with DuckDB for analytics, Groq for AI (PDF extraction + NL-to-SQL). Data loaded from City Contracts CSV (1,365 records, validated). Two route groups: `/staff` and `/public`.

**Tech Stack:** Next.js 14, React 18, shadcn/ui, Recharts, TanStack Table, FastAPI, DuckDB, Groq, pypdf, Vercel

---

## File Structure

```
hackrva/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, lifespan
│   │   ├── db.py                      # DuckDB connection + queries
│   │   ├── routers/
│   │   │   ├── contracts.py           # /api/contracts — list, filter, stats
│   │   │   ├── extract.py             # /api/extract — PDF upload + LLM parse
│   │   │   └── nl_query.py            # /api/nl-query — NL-to-SQL
│   │   ├── services/
│   │   │   ├── groq_client.py         # Groq API wrapper
│   │   │   └── pdf_extractor.py       # pypdf text extraction + LLM structuring
│   │   └── schemas.py                 # Pydantic models
│   ├── data/
│   │   └── (CSVs + DuckDB file land here)
│   ├── scripts/
│   │   └── ingest.py                  # CSV download + DuckDB loading
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with nav
│   │   │   ├── page.tsx               # Landing / redirect
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx           # Staff dashboard
│   │   │   │   └── extract/
│   │   │   │       └── page.tsx       # PDF extraction page
│   │   │   └── public/
│   │   │       ├── page.tsx           # Transparency explorer
│   │   │       └── vendor/
│   │   │           └── [name]/
│   │   │               └── page.tsx   # Vendor detail page
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── contracts-table.tsx    # TanStack Table for contracts
│   │   │   ├── risk-alerts.tsx        # Risk alerts panel
│   │   │   ├── nl-query-bar.tsx       # Natural language query input
│   │   │   ├── pdf-upload.tsx         # PDF upload + results
│   │   │   ├── spending-charts.tsx    # Recharts spending visualizations
│   │   │   ├── vendor-card.tsx        # Vendor profile card
│   │   │   ├── contract-detail.tsx    # Contract detail drawer/modal
│   │   │   ├── data-badge.tsx         # Source provenance badge
│   │   │   └── disclaimer.tsx         # Advisory disclaimer banner
│   │   ├── lib/
│   │   │   ├── api.ts                 # Fetch wrapper for backend
│   │   │   └── utils.ts              # Formatters (currency, dates, risk color)
│   │   └── hooks/
│   │       └── use-contracts.ts       # React Query hooks
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.mjs
├── docs/
├── scripts/
├── .gitignore
└── README.md
```

---

## Task 1: Project Scaffold + Data Ingestion (P0)

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/main.py`
- Create: `backend/app/db.py`
- Create: `backend/scripts/ingest.py`
- Create: `frontend/` (via create-next-app)
- Create: `.gitignore`

- [ ] **Step 1: Create backend scaffold**

```bash
mkdir -p backend/app/routers backend/app/services backend/data backend/scripts
```

Create `backend/requirements.txt`:
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
duckdb==1.1.3
pypdf==5.1.0
python-multipart==0.0.18
groq==0.15.0
httpx==0.28.1
python-dotenv==1.0.1
polars==1.20.0
```

Create `backend/.env.example`:
```
GROQ_API_KEY=your-groq-api-key
```

- [ ] **Step 2: Create DuckDB connection module**

Create `backend/app/db.py`:
```python
import duckdb
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "contracts.duckdb"

def get_db():
    return duckdb.connect(str(DB_PATH), read_only=True)

def query(sql: str, params: list | None = None) -> list[dict]:
    conn = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        if params:
            result = conn.execute(sql, params)
        else:
            result = conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        return [dict(zip(columns, row)) for row in result.fetchall()]
    finally:
        conn.close()
```

- [ ] **Step 3: Create data ingestion script**

Create `backend/scripts/ingest.py`:
```python
#!/usr/bin/env python3
"""Download City Contracts CSV and load into DuckDB."""

import duckdb
import polars as pl
from pathlib import Path
from datetime import date, datetime
import httpx

DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DATA_DIR / "contracts.duckdb"
CSV_URL = "https://data.richmondgov.com/api/views/xqn7-jvv2/rows.csv?accessType=DOWNLOAD"
CSV_PATH = DATA_DIR / "city_contracts.csv"


def download_csv():
    print("Downloading City Contracts CSV...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    resp = httpx.get(CSV_URL, follow_redirects=True, timeout=30)
    resp.raise_for_status()
    CSV_PATH.write_bytes(resp.content)
    print(f"Downloaded {len(resp.content)} bytes to {CSV_PATH}")


def load_into_duckdb():
    print("Loading into DuckDB...")
    if DB_PATH.exists():
        DB_PATH.unlink()

    df = pl.read_csv(CSV_PATH)
    print(f"Read {len(df)} rows, columns: {df.columns}")

    # Rename columns to snake_case
    col_map = {
        "Agency/Department": "department",
        "Contract Number": "contract_number",
        "Contract Value": "contract_value",
        "Supplier": "supplier",
        "Procurement Type": "procurement_type",
        "Description": "description",
        "Type of Solicitation": "solicitation_type",
        "Effective From": "effective_from",
        "Effective To": "effective_to",
    }
    df = df.rename(col_map)

    # Parse dates
    today = date.today()

    def parse_date(s):
        if s is None or s.strip() == "":
            return None
        try:
            return datetime.strptime(s.strip(), "%m/%d/%Y %I:%M:%S %p").date()
        except ValueError:
            return None

    df = df.with_columns([
        pl.col("effective_from").map_elements(parse_date, return_dtype=pl.Date).alias("start_date"),
        pl.col("effective_to").map_elements(parse_date, return_dtype=pl.Date).alias("end_date"),
        pl.col("contract_value").cast(pl.Float64, strict=False).alias("value"),
    ])

    df = df.with_columns([
        ((pl.col("end_date") - pl.lit(today)).dt.total_days()).alias("days_to_expiry"),
    ])

    # Risk level
    df = df.with_columns([
        pl.when(pl.col("days_to_expiry").is_null())
        .then(pl.lit("unknown"))
        .when(pl.col("days_to_expiry") <= 0)
        .then(pl.lit("expired"))
        .when(pl.col("days_to_expiry") <= 30)
        .then(pl.lit("critical"))
        .when(pl.col("days_to_expiry") <= 60)
        .then(pl.lit("warning"))
        .when(pl.col("days_to_expiry") <= 90)
        .then(pl.lit("attention"))
        .otherwise(pl.lit("ok"))
        .alias("risk_level"),
    ])

    conn = duckdb.connect(str(DB_PATH))
    conn.execute("CREATE TABLE city_contracts AS SELECT * FROM df")

    count = conn.execute("SELECT COUNT(*) FROM city_contracts").fetchone()[0]
    print(f"Loaded {count} contracts into DuckDB")

    # Print summary
    expiring_30 = conn.execute(
        "SELECT COUNT(*) FROM city_contracts WHERE days_to_expiry BETWEEN 0 AND 30"
    ).fetchone()[0]
    expiring_60 = conn.execute(
        "SELECT COUNT(*) FROM city_contracts WHERE days_to_expiry BETWEEN 0 AND 60"
    ).fetchone()[0]
    print(f"Expiring in 30 days: {expiring_30}")
    print(f"Expiring in 60 days: {expiring_60}")

    conn.close()
    print(f"DuckDB saved to {DB_PATH}")


if __name__ == "__main__":
    download_csv()
    load_into_duckdb()
```

- [ ] **Step 4: Create FastAPI main app**

Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RVA Contract Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Scaffold Next.js frontend**

```bash
cd /Users/ithena/Documents/CodeSpace/hackrva
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 6: Install frontend dependencies**

```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-table recharts lucide-react class-variance-authority clsx tailwind-merge sonner
npx shadcn@latest init -d
npx shadcn@latest add button card input table badge dialog sheet tabs select separator
```

- [ ] **Step 7: Create .gitignore and run ingestion**

Create `.gitignore` at project root:
```
__pycache__
*.pyc
.env
backend/data/*.duckdb
backend/data/*.csv
node_modules
.next
.vercel
```

```bash
cd backend && pip install -r requirements.txt && python scripts/ingest.py
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold project + ingest 1,365 city contracts into DuckDB"
```

---

## Task 2: Contracts API (P0)

**Files:**
- Create: `backend/app/schemas.py`
- Create: `backend/app/routers/contracts.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create Pydantic schemas**

Create `backend/app/schemas.py`:
```python
from pydantic import BaseModel
from datetime import date

class Contract(BaseModel):
    department: str | None = None
    contract_number: str | None = None
    value: float | None = None
    supplier: str | None = None
    procurement_type: str | None = None
    description: str | None = None
    solicitation_type: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    days_to_expiry: int | None = None
    risk_level: str | None = None

class ContractsResponse(BaseModel):
    contracts: list[Contract]
    total: int

class StatsResponse(BaseModel):
    total_contracts: int
    total_value: float
    expiring_30: int
    expiring_60: int
    expiring_90: int
    departments: list[dict]
    top_vendors: list[dict]
```

- [ ] **Step 2: Create contracts router**

Create `backend/app/routers/contracts.py`:
```python
from fastapi import APIRouter, Query
from app.db import query

router = APIRouter(prefix="/api/contracts", tags=["contracts"])

@router.get("")
def list_contracts(
    department: str | None = None,
    risk_level: str | None = None,
    min_value: float | None = None,
    max_days: int | None = None,
    search: str | None = None,
    limit: int = Query(default=100, le=2000),
    offset: int = 0,
):
    sql = "SELECT * FROM city_contracts WHERE 1=1"
    params = []

    if department:
        sql += " AND department = ?"
        params.append(department)
    if risk_level:
        sql += " AND risk_level = ?"
        params.append(risk_level)
    if min_value is not None:
        sql += " AND value >= ?"
        params.append(min_value)
    if max_days is not None:
        sql += " AND days_to_expiry BETWEEN 0 AND ?"
        params.append(max_days)
    if search:
        sql += " AND (description ILIKE ? OR supplier ILIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    count_sql = sql.replace("SELECT *", "SELECT COUNT(*)")
    total = query(count_sql, params)[0]["count_star()"]

    sql += " ORDER BY days_to_expiry ASC NULLS LAST LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = query(sql, params)
    return {"contracts": rows, "total": total}


@router.get("/stats")
def contract_stats():
    stats = query("""
        SELECT
            COUNT(*) as total_contracts,
            SUM(value) as total_value,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 30 THEN 1 ELSE 0 END) as expiring_30,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 60 THEN 1 ELSE 0 END) as expiring_60,
            SUM(CASE WHEN days_to_expiry BETWEEN 0 AND 90 THEN 1 ELSE 0 END) as expiring_90
        FROM city_contracts
    """)[0]

    departments = query("""
        SELECT department, COUNT(*) as count, SUM(value) as total_value
        FROM city_contracts
        GROUP BY department
        ORDER BY total_value DESC
    """)

    top_vendors = query("""
        SELECT supplier, COUNT(*) as count, SUM(value) as total_value
        FROM city_contracts
        GROUP BY supplier
        ORDER BY total_value DESC
        LIMIT 20
    """)

    return {**stats, "departments": departments, "top_vendors": top_vendors}


@router.get("/departments")
def list_departments():
    return query("SELECT DISTINCT department FROM city_contracts ORDER BY department")


@router.get("/{contract_number}")
def get_contract(contract_number: str):
    rows = query("SELECT * FROM city_contracts WHERE contract_number = ?", [contract_number])
    if not rows:
        return {"error": "Not found"}
    return rows[0]
```

- [ ] **Step 3: Register router in main.py**

Add to `backend/app/main.py`:
```python
from app.routers import contracts

app.include_router(contracts.router)
```

- [ ] **Step 4: Test the API**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
# In another terminal:
curl http://localhost:8000/api/contracts/stats | python3 -m json.tool
curl "http://localhost:8000/api/contracts?max_days=30&limit=5" | python3 -m json.tool
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add contracts API with filtering, stats, and department endpoints"
```

---

## Task 3: Frontend Shell + API Client (P0)

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/hooks/use-contracts.ts`
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/disclaimer.tsx`
- Create: `frontend/src/components/data-badge.tsx`

- [ ] **Step 1: Create API client**

Create `frontend/src/lib/api.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Create utility functions**

Create `frontend/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(d: string | null): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function riskColor(level: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-700 border-red-200",
    warning: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    attention: "bg-orange-500/10 text-orange-700 border-orange-200",
    ok: "bg-green-500/10 text-green-700 border-green-200",
    expired: "bg-gray-500/10 text-gray-500 border-gray-200",
    unknown: "bg-gray-500/10 text-gray-400 border-gray-200",
  };
  return colors[level] || colors.unknown;
}

export function riskLabel(level: string): string {
  const labels: Record<string, string> = {
    critical: "≤30 days",
    warning: "31-60 days",
    attention: "61-90 days",
    ok: "90+ days",
    expired: "Expired",
    unknown: "Unknown",
  };
  return labels[level] || level;
}
```

- [ ] **Step 3: Create React Query hooks**

Create `frontend/src/hooks/use-contracts.ts`:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

export function useContracts(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ["contracts", params],
    queryFn: () => fetchAPI<{ contracts: any[]; total: number }>("/api/contracts", params),
  });
}

export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: () => fetchAPI<any>("/api/contracts/stats"),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchAPI<any[]>("/api/contracts/departments"),
  });
}
```

- [ ] **Step 4: Create shared components**

Create `frontend/src/components/disclaimer.tsx`:
```typescript
export function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2 text-sm text-amber-800">
      Exploratory tool — not official City financial reporting. Data source: City of Richmond Open Data (Socrata).
    </div>
  );
}
```

Create `frontend/src/components/data-badge.tsx`:
```typescript
import { Badge } from "@/components/ui/badge";

export function DataBadge({ source = "City of Richmond Open Data" }: { source?: string }) {
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Source: {source}
    </Badge>
  );
}
```

- [ ] **Step 5: Create root layout with nav**

Modify `frontend/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "RVA Contract Lens",
  description: "Richmond procurement transparency tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          <nav className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
              <Link href="/" className="font-bold text-lg">RVA Contract Lens</Link>
              <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">Staff Dashboard</Link>
              <Link href="/public" className="text-sm text-muted-foreground hover:text-foreground">Public Transparency</Link>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

Create `frontend/src/components/query-provider.tsx`:
```typescript
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 6: Create landing page**

Create `frontend/src/app/page.tsx`:
```typescript
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <h1 className="text-4xl font-bold">RVA Contract Lens</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        Richmond spends $6.1 billion in public contracts. Now you can see where it goes.
      </p>
      <div className="flex gap-4">
        <Link href="/staff" className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90">
          Staff Dashboard
        </Link>
        <Link href="/public" className="px-6 py-3 border rounded-md font-medium hover:bg-muted">
          Public Transparency
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify frontend runs**

```bash
cd frontend && npm run dev
# Visit http://localhost:3000 — should see landing page with nav
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add frontend shell with nav, API client, and shared components"
```

---

## Task 4: Staff Dashboard — Contracts Table + Filters (P0)

**Files:**
- Create: `frontend/src/components/contracts-table.tsx`
- Create: `frontend/src/components/risk-alerts.tsx`
- Create: `frontend/src/components/contract-detail.tsx`
- Create: `frontend/src/app/staff/page.tsx`

- [ ] **Step 1: Create contracts table component**

Create `frontend/src/components/contracts-table.tsx`:
```typescript
"use client";
import { useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, riskColor, riskLabel } from "@/lib/utils";

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "risk_level",
    header: "Risk",
    cell: ({ getValue }) => {
      const level = getValue() as string;
      return <Badge className={riskColor(level)}>{riskLabel(level)}</Badge>;
    },
    size: 100,
  },
  { accessorKey: "supplier", header: "Vendor", size: 200 },
  { accessorKey: "department", header: "Department", size: 180 },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ getValue }) => formatCurrency(getValue() as number),
    size: 120,
  },
  {
    accessorKey: "end_date",
    header: "Expires",
    cell: ({ getValue }) => formatDate(getValue() as string),
    size: 120,
  },
  {
    accessorKey: "days_to_expiry",
    header: "Days Left",
    cell: ({ getValue }) => {
      const d = getValue() as number | null;
      if (d === null) return "—";
      if (d < 0) return <span className="text-gray-400">Expired</span>;
      return d;
    },
    size: 80,
  },
  { accessorKey: "description", header: "Description", size: 300 },
];

export function ContractsTable({ data, onRowClick }: { data: any[]; onRowClick?: (row: any) => void }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "days_to_expiry", desc: false }]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="border rounded-lg overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-3 py-2 text-left font-medium cursor-pointer select-none"
                  onClick={h.column.getToggleSortingHandler()}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t hover:bg-muted/30 cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 max-w-[300px] truncate">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create risk alerts panel**

Create `frontend/src/components/risk-alerts.tsx`:
```typescript
"use client";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function RiskAlerts({ stats }: { stats: any }) {
  if (!stats) return null;
  const cards = [
    { label: "Total Contracts", value: stats.total_contracts, color: "text-foreground" },
    { label: "Total Value", value: formatCurrency(stats.total_value), color: "text-foreground" },
    { label: "Expiring ≤30 days", value: stats.expiring_30, color: "text-red-600" },
    { label: "Expiring ≤60 days", value: stats.expiring_60, color: "text-yellow-600" },
    { label: "Expiring ≤90 days", value: stats.expiring_90, color: "text-orange-600" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create contract detail component**

Create `frontend/src/components/contract-detail.tsx`:
```typescript
"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, riskColor, riskLabel } from "@/lib/utils";

export function ContractDetail({ contract, open, onClose }: { contract: any | null; open: boolean; onClose: () => void }) {
  if (!contract) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contract.supplier}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Badge className={riskColor(contract.risk_level)}>{riskLabel(contract.risk_level)}</Badge>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Contract #</span><br />{contract.contract_number}</div>
            <div><span className="text-muted-foreground">Value</span><br />{formatCurrency(contract.value)}</div>
            <div><span className="text-muted-foreground">Department</span><br />{contract.department}</div>
            <div><span className="text-muted-foreground">Type</span><br />{contract.procurement_type}</div>
            <div><span className="text-muted-foreground">Start</span><br />{formatDate(contract.start_date)}</div>
            <div><span className="text-muted-foreground">Expires</span><br />{formatDate(contract.end_date)}</div>
            <div><span className="text-muted-foreground">Days Left</span><br />{contract.days_to_expiry ?? "N/A"}</div>
            <div><span className="text-muted-foreground">Solicitation</span><br />{contract.solicitation_type}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Description</span>
            <p className="text-sm mt-1">{contract.description}</p>
          </div>
          <div className="text-xs text-muted-foreground pt-4 border-t">
            Source: City of Richmond Open Data (Socrata)
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Create staff dashboard page**

Create `frontend/src/app/staff/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { useContracts, useContractStats, useDepartments } from "@/hooks/use-contracts";
import { ContractsTable } from "@/components/contracts-table";
import { RiskAlerts } from "@/components/risk-alerts";
import { ContractDetail } from "@/components/contract-detail";
import { Disclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function StaffDashboard() {
  const [maxDays, setMaxDays] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const params: Record<string, string | number> = { limit: 500 };
  if (maxDays) params.max_days = Number(maxDays);
  if (department && department !== "all") params.department = department;
  if (search) params.search = search;

  const { data, isLoading } = useContracts(params);
  const { data: stats } = useContractStats();
  const { data: departments } = useDepartments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Dashboard — Contract Risk</h1>
        <Link href="/staff/extract">
          <Button variant="outline">PDF Extractor</Button>
        </Link>
      </div>

      <Disclaimer />
      <RiskAlerts stats={stats} />

      <div className="flex gap-3 items-center flex-wrap">
        <Input
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={maxDays} onValueChange={setMaxDays}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Expiry filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contracts</SelectItem>
            <SelectItem value="30">Expiring ≤30 days</SelectItem>
            <SelectItem value="60">Expiring ≤60 days</SelectItem>
            <SelectItem value="90">Expiring ≤90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments?.map((d: any) => (
              <SelectItem key={d.department} value={d.department}>{d.department}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(maxDays || department || search) && (
          <Button variant="ghost" onClick={() => { setMaxDays(""); setDepartment(""); setSearch(""); }}>Clear</Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading contracts...</div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">{data?.total} contracts</div>
          <ContractsTable data={data?.contracts || []} onRowClick={setSelected} />
        </>
      )}

      <ContractDetail contract={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
```

- [ ] **Step 5: Run both servers and verify**

```bash
# Terminal 1: backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend
cd frontend && npm run dev

# Visit http://localhost:3000/staff
# Should see: risk alert cards, filters, contracts table with data
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add staff dashboard with contracts table, filters, risk alerts, detail drawer"
```

---

## Task 5: Public Transparency View — Spending Charts (P0)

**Files:**
- Create: `frontend/src/components/spending-charts.tsx`
- Create: `frontend/src/components/vendor-card.tsx`
- Create: `frontend/src/app/public/page.tsx`

- [ ] **Step 1: Create spending charts component**

Create `frontend/src/components/spending-charts.tsx`:
```typescript
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#b91c1c"];

function currencyTick(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DepartmentSpendingChart({ data }: { data: any[] }) {
  const sorted = [...data].sort((a, b) => b.total_value - a.total_value).slice(0, 10);
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Spending by Department (Top 10)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 140 }}>
          <XAxis type="number" tickFormatter={currencyTick} />
          <YAxis type="category" dataKey="department" width={130} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Bar dataKey="total_value" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function VendorPieChart({ data }: { data: any[] }) {
  const top8 = data.slice(0, 8);
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Top Vendors by Contract Value</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie data={top8} dataKey="total_value" nameKey="supplier" cx="50%" cy="50%" outerRadius={120} label={({ supplier }) => supplier?.slice(0, 20)}>
            {top8.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

- [ ] **Step 2: Create vendor card component**

Create `frontend/src/components/vendor-card.tsx`:
```typescript
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export function VendorCard({ vendor }: { vendor: any }) {
  return (
    <Link href={`/public/vendor/${encodeURIComponent(vendor.supplier)}`}>
      <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors">
        <div className="font-medium">{vendor.supplier}</div>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <span>{vendor.count} contracts</span>
          <span>{formatCurrency(vendor.total_value)}</span>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Create public transparency page**

Create `frontend/src/app/public/page.tsx`:
```typescript
"use client";
import { useContractStats } from "@/hooks/use-contracts";
import { DepartmentSpendingChart, VendorPieChart } from "@/components/spending-charts";
import { VendorCard } from "@/components/vendor-card";
import { Disclaimer } from "@/components/disclaimer";
import { DataBadge } from "@/components/data-badge";
import { formatCurrency } from "@/lib/utils";

export default function PublicTransparency() {
  const { data: stats, isLoading } = useContractStats();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Where Do Your Tax Dollars Go?</h1>
        <p className="text-muted-foreground mt-2">
          Explore {stats.total_contracts.toLocaleString()} City of Richmond contracts worth {formatCurrency(stats.total_value)}.
        </p>
        <div className="flex gap-2 mt-3">
          <DataBadge />
          <DataBadge source="Updated March 2026" />
        </div>
      </div>

      <Disclaimer />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-700">{formatCurrency(stats.total_value)}</div>
          <div className="text-sm text-blue-600 mt-1">Total Contract Value</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-700">{stats.total_contracts.toLocaleString()}</div>
          <div className="text-sm text-purple-600 mt-1">Active Contracts</div>
        </div>
        <div className="bg-red-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-red-700">{stats.expiring_30}</div>
          <div className="text-sm text-red-600 mt-1">Expiring in 30 Days</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DepartmentSpendingChart data={stats.departments} />
        <VendorPieChart data={stats.top_vendors} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Top 20 Vendors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.top_vendors?.map((v: any) => <VendorCard key={v.supplier} vendor={v} />)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify public view**

```bash
# Visit http://localhost:3000/public
# Should see: hero stats, spending charts, vendor grid
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add public transparency view with spending charts and vendor explorer"
```

---

## Task 6: PDF Extraction Endpoint + UI (P1)

**Files:**
- Create: `backend/app/services/groq_client.py`
- Create: `backend/app/services/pdf_extractor.py`
- Create: `backend/app/routers/extract.py`
- Modify: `backend/app/main.py`
- Create: `frontend/src/components/pdf-upload.tsx`
- Create: `frontend/src/app/staff/extract/page.tsx`

- [ ] **Step 1: Create Groq client**

Create `backend/app/services/groq_client.py`:
```python
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def chat(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.1,
        max_tokens=2000,
    )
    return resp.choices[0].message.content
```

- [ ] **Step 2: Create PDF extractor service**

Create `backend/app/services/pdf_extractor.py`:
```python
import json
from pypdf import PdfReader
from app.services.groq_client import chat

EXTRACTION_PROMPT = """You are a contract analysis assistant. Extract the following fields from the contract text.
Return ONLY valid JSON with these fields:
{
  "expiration_date": "date or null",
  "renewal_option": "description or null",
  "pricing_structure": "description or null",
  "key_conditions": ["list of key conditions"],
  "parties": ["list of party names"],
  "contract_value": "dollar amount or null",
  "summary": "2-3 sentence plain-language summary"
}
If a field cannot be determined from the text, set it to null. Do not guess."""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(file_bytes)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_contract_terms(pdf_bytes: bytes) -> dict:
    text = extract_text_from_pdf(pdf_bytes)
    if not text.strip():
        return {"error": "Could not extract text from PDF"}

    # Truncate to ~8000 chars to stay within token limits
    truncated = text[:8000]
    raw = chat(EXTRACTION_PROMPT, f"Contract text:\n\n{truncated}")

    try:
        # Strip markdown code fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"error": "Failed to parse extraction", "raw_response": raw}
```

- [ ] **Step 3: Create extract router**

Create `backend/app/routers/extract.py`:
```python
import io
from fastapi import APIRouter, UploadFile, File
from app.services.pdf_extractor import extract_contract_terms

router = APIRouter(prefix="/api/extract", tags=["extract"])

@router.post("")
async def extract_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    result = extract_contract_terms(io.BytesIO(contents))
    return {
        "filename": file.filename,
        "extraction": result,
        "disclaimer": "AI-assisted extraction — verify against original document",
    }
```

- [ ] **Step 4: Register extract router**

Add to `backend/app/main.py`:
```python
from app.routers import extract
app.include_router(extract.router)
```

- [ ] **Step 5: Create PDF upload frontend component**

Create `frontend/src/components/pdf-upload.tsx`:
```typescript
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function PdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/extract`, { method: "POST", body: form });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: "Upload failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
          className="hidden"
          id="pdf-input"
        />
        <label htmlFor="pdf-input" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {file ? file.name : "Click to select a procurement PDF"}
          </span>
        </label>
      </div>

      {file && (
        <Button onClick={handleUpload} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</> : <><FileText className="mr-2 h-4 w-4" /> Extract Key Terms</>}
        </Button>
      )}

      {result && !result.error && (
        <Card className="p-6 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-700">
            {result.disclaimer}
          </div>
          <h3 className="font-semibold">Extracted Terms</h3>
          {result.extraction.summary && <p className="text-sm">{result.extraction.summary}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Expiration</span><br />{result.extraction.expiration_date || "N/A"}</div>
            <div><span className="text-muted-foreground">Value</span><br />{result.extraction.contract_value || "N/A"}</div>
            <div><span className="text-muted-foreground">Renewal</span><br />{result.extraction.renewal_option || "N/A"}</div>
            <div><span className="text-muted-foreground">Pricing</span><br />{result.extraction.pricing_structure || "N/A"}</div>
          </div>
          {result.extraction.parties?.length > 0 && (
            <div><span className="text-sm text-muted-foreground">Parties:</span> <span className="text-sm">{result.extraction.parties.join(", ")}</span></div>
          )}
          {result.extraction.key_conditions?.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Key Conditions:</span>
              <ul className="text-sm list-disc ml-4 mt-1">
                {result.extraction.key_conditions.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      {result?.error && <div className="text-red-600 text-sm">{result.error}</div>}
    </div>
  );
}
```

- [ ] **Step 6: Create extract page**

Create `frontend/src/app/staff/extract/page.tsx`:
```typescript
import { PdfUpload } from "@/components/pdf-upload";
import { Disclaimer } from "@/components/disclaimer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExtractPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contract PDF Extractor</h1>
        <Link href="/staff"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
      <p className="text-muted-foreground">
        Upload a procurement PDF to extract key terms: expiration dates, renewal options, pricing, and conditions.
      </p>
      <Disclaimer />
      <PdfUpload />
    </div>
  );
}
```

- [ ] **Step 7: Test PDF extraction**

```bash
# Ensure GROQ_API_KEY is set in backend/.env
# Upload any PDF via http://localhost:3000/staff/extract
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add PDF contract extractor with Groq AI extraction"
```

---

## Task 7: Natural Language Query Bar (P1)

**Files:**
- Create: `backend/app/routers/nl_query.py`
- Modify: `backend/app/main.py`
- Create: `frontend/src/components/nl-query-bar.tsx`
- Modify: `frontend/src/app/staff/page.tsx`

- [ ] **Step 1: Create NL-to-SQL router**

Create `backend/app/routers/nl_query.py`:
```python
import json
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.groq_client import chat
from app.db import query

router = APIRouter(prefix="/api/nl-query", tags=["nl-query"])

NL_TO_SQL_PROMPT = """You are a SQL assistant. Convert the user's question into a DuckDB SQL query.

The database has one table: city_contracts with these columns:
- department (VARCHAR): City department name
- contract_number (VARCHAR): Unique contract ID
- value (DOUBLE): Contract dollar value
- supplier (VARCHAR): Vendor/company name
- procurement_type (VARCHAR): How it was procured
- description (VARCHAR): Contract description text
- solicitation_type (VARCHAR): Type of solicitation
- start_date (DATE): Contract start date
- end_date (DATE): Contract end date
- days_to_expiry (INTEGER): Days until expiration (negative = expired)
- risk_level (VARCHAR): One of: critical, warning, attention, ok, expired, unknown

Today's date is 2026-03-27.

Return ONLY a JSON object: {"sql": "SELECT ...", "explanation": "plain English explanation"}
Do NOT use markdown code fences. Return raw JSON only.
Keep queries safe — SELECT only, no modifications."""


class NLQueryRequest(BaseModel):
    question: str


@router.post("")
def nl_query(req: NLQueryRequest):
    raw = chat(NL_TO_SQL_PROMPT, req.question)
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        parsed = json.loads(cleaned)
        sql = parsed["sql"]

        if not sql.strip().upper().startswith("SELECT"):
            return {"error": "Only SELECT queries are allowed"}

        results = query(sql)
        return {
            "sql": sql,
            "explanation": parsed.get("explanation", ""),
            "results": results[:100],
            "total": len(results),
        }
    except json.JSONDecodeError:
        return {"error": "Could not parse query", "raw": raw}
    except Exception as e:
        return {"error": str(e)}
```

- [ ] **Step 2: Register nl_query router**

Add to `backend/app/main.py`:
```python
from app.routers import nl_query
app.include_router(nl_query.router)
```

- [ ] **Step 3: Create NL query bar component**

Create `frontend/src/components/nl-query-bar.tsx`:
```typescript
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EXAMPLES = [
  "Show me all contracts expiring in the next 30 days",
  "Which department has the highest total contract value?",
  "List Public Works contracts over $1 million",
  "Who are the top 5 vendors by number of contracts?",
];

export function NLQueryBar() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleQuery(q?: string) {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setQuestion(query);
    try {
      const res = await fetch(`${API_BASE}/api/nl-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Query failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Ask about contracts in plain English..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuery()}
        />
        <Button onClick={() => handleQuery()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {!result && (
        <div className="flex gap-2 flex-wrap">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleQuery(ex)}
              className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {result?.error && <div className="text-red-600 text-sm">{result.error}</div>}

      {result?.results && (
        <Card className="p-4 space-y-3">
          <div className="text-sm text-muted-foreground">{result.explanation}</div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">View SQL</summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{result.sql}</pre>
          </details>
          <div className="text-xs text-muted-foreground">{result.total} results</div>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {result.results[0] && Object.keys(result.results[0]).map((k) => (
                    <th key={k} className="px-2 py-1 text-left font-medium">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.results.slice(0, 50).map((row: any, i: number) => (
                  <tr key={i} className="border-t">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-2 py-1 max-w-[200px] truncate">{String(v ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add NL query bar to staff dashboard**

Add import and component to `frontend/src/app/staff/page.tsx`, after the `<RiskAlerts>` and before the filters:
```typescript
import { NLQueryBar } from "@/components/nl-query-bar";

// Add inside the page component, after <RiskAlerts stats={stats} />:
<NLQueryBar />
```

- [ ] **Step 5: Test NL queries**

```bash
# Visit http://localhost:3000/staff
# Try: "Show me all contracts expiring in the next 30 days"
# Try: "Which department has the highest total contract value?"
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add natural language query bar with Groq NL-to-SQL"
```

---

## Task 8: Vendor Detail Page (P1)

**Files:**
- Create: `backend/app/routers/contracts.py` (add vendor endpoint)
- Create: `frontend/src/app/public/vendor/[name]/page.tsx`

- [ ] **Step 1: Add vendor endpoint to contracts router**

Add to `backend/app/routers/contracts.py`:
```python
@router.get("/vendor/{supplier}")
def vendor_detail(supplier: str):
    contracts = query(
        "SELECT * FROM city_contracts WHERE supplier = ? ORDER BY end_date DESC",
        [supplier],
    )
    stats = query(
        """SELECT COUNT(*) as count, SUM(value) as total_value,
           MIN(start_date) as first_contract, MAX(end_date) as last_expiry,
           COUNT(DISTINCT department) as departments_served
           FROM city_contracts WHERE supplier = ?""",
        [supplier],
    )
    return {"supplier": supplier, "contracts": contracts, "stats": stats[0] if stats else {}}
```

- [ ] **Step 2: Create vendor detail page**

Create `frontend/src/app/public/vendor/[name]/page.tsx`:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { ContractsTable } from "@/components/contracts-table";
import { Disclaimer } from "@/components/disclaimer";
import { DataBadge } from "@/components/data-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VendorDetailPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", decodedName],
    queryFn: () => fetchAPI<any>(`/api/contracts/vendor/${encodeURIComponent(decodedName)}`),
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!data) return null;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.supplier}</h1>
          <DataBadge />
        </div>
        <Link href="/public"><Button variant="outline">Back</Button></Link>
      </div>

      <Disclaimer />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Contracts</div><div className="text-xl font-bold">{s.count}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total Value</div><div className="text-xl font-bold">{formatCurrency(s.total_value)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Departments Served</div><div className="text-xl font-bold">{s.departments_served}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Last Expiry</div><div className="text-xl font-bold">{formatDate(s.last_expiry)}</div></Card>
      </div>

      <ContractsTable data={data.contracts} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add vendor detail page with contract history and stats"
```

---

## Task 9: Polish + Deploy (P0)

**Files:**
- Modify: `frontend/next.config.mjs`
- Create: `README.md`

- [ ] **Step 1: Add environment config for Vercel**

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 2: Verify full flow**

```bash
# Both servers running
# 1. Visit /staff — see table, filter by 30 days, click a contract, use NL query
# 2. Visit /staff/extract — upload a PDF
# 3. Visit /public — see charts, click a vendor
# 4. Visit /public/vendor/[name] — see vendor detail
```

- [ ] **Step 3: Deploy frontend to Vercel**

```bash
cd frontend && npx vercel --prod
```

- [ ] **Step 4: Create README**

Create `README.md`:
```markdown
# RVA Contract Lens

Richmond procurement transparency tool built for Hack for RVA 2026.

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add GROQ_API_KEY
python scripts/ingest.py
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Data Sources
- City Contracts: data.richmondgov.com (Socrata xqn7-jvv2)
- SAM.gov: Federal contracts (API key required)
- eVA: Virginia state procurement

## Disclaimer
Exploratory tool — not official City financial reporting.
```

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat: polish, deploy config, and README"
```

---

## Summary

| Task | Priority | Estimated Time | Delivers |
|------|----------|---------------|----------|
| 1. Scaffold + Data Ingestion | P0 | 1.5 hr | Project structure, DuckDB with 1,365 contracts |
| 2. Contracts API | P0 | 1 hr | REST endpoints for all contract queries |
| 3. Frontend Shell | P0 | 1 hr | Nav, API client, shared components |
| 4. Staff Dashboard | P0 | 2 hr | Table, filters, risk alerts, detail drawer |
| 5. Public Transparency | P0 | 1.5 hr | Spending charts, vendor grid, hero stats |
| 6. PDF Extraction | P1 | 1.5 hr | Upload PDF → AI extracts key terms |
| 7. NL Query Bar | P1 | 1 hr | Natural language contract queries |
| 8. Vendor Detail | P1 | 0.5 hr | Vendor profile with contract history |
| 9. Polish + Deploy | P0 | 0.5 hr | Vercel deploy, README |

**Total: ~10.5 hours** — fits comfortably in Friday evening + Saturday.
