# RVA Contract Lens — Design Spec

**Date:** 2026-03-27
**Pillar:** A Thriving City Hall (Track 1)
**Problem:** #2 — Procurement Risk & Opportunity Review (22/32) + Blue Sky: Fiscal Transparency (21/27)
**MVP Shapes Combined:** C (Expiry Tracker) + D (PDF Extractor) + E (Transparency Dashboard)
**Hackathon:** Hack for RVA, March 27–29, 2026

---

## 1. Problem Statement

City procurement staff rely on multiple contract sources — City contracts, VITA state contracts, GSA federal contracts, and cooperative purchasing agreements. Key details (expiration dates, renewal windows, pricing terms) are buried in PDFs or spread across different systems. No unified view exists. Staff manually scan PDFs and databases to make procurement decisions.

**Primary user:** City procurement staff
**Secondary user:** Richmond residents (transparency view)

**What winning looks like (rubric):**
- Impact (5x): Directly addresses Problem 2
- User Value (4x): Specific user, measurable improvement
- Feasibility (3x): Could be piloted by a City department within a year
- Innovation (3x): Fresh approach to procurement transparency
- Execution (3x): Working demo with coherent flow
- Equity (3x): Makes public spending visible to all residents

**Maximum score:** 105. Tiebreaker: User Value.

---

## 2. Solution Overview

A two-view web application called **RVA Contract Lens**:

1. **Staff View** — Procurement contract risk dashboard with expiration tracking, PDF key-term extraction, and natural language querying across contract data
2. **Public View** — Transparency explorer showing spending trends, vendor analysis, and plain-language contract descriptions

All data sourced from public datasets. AI extraction labeled advisory. No compliance determinations.

---

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js + shadcn/ui)             │
│  ├── Staff Dashboard (auth-gated)           │
│  │   ├── Expiry Tracker (TanStack Table)    │
│  │   ├── Risk Alerts Panel                  │
│  │   ├── PDF Upload + Extraction View       │
│  │   └── NL Query Bar                       │
│  └── Public Transparency Explorer           │
│      ├── Spending Charts (Recharts)         │
│      ├── Vendor Explorer                    │
│      └── Contract Search                    │
├─────────────────────────────────────────────┤
│  Backend (FastAPI)                          │
│  ├── /api/contracts — query DuckDB          │
│  ├── /api/extract — PDF upload + LLM parse  │
│  ├── /api/nl-query — NL-to-SQL via Groq     │
│  └── /api/stats — aggregation endpoints     │
├─────────────────────────────────────────────┤
│  Data Layer (DuckDB, in-process)            │
│  ├── city_contracts (Socrata CSV xqn7-jvv2) │
│  ├── sam_contracts (SAM.gov API)            │
│  └── eva_contracts (eVA CSV)               │
└─────────────────────────────────────────────┘
```

### Stack Decisions

| Choice | Reason |
|--------|--------|
| **Next.js** | SSR for public view SEO, app router for staff view, team expertise |
| **FastAPI** | Team expertise, async, fast to build |
| **DuckDB** | Zero setup, native CSV loading, SQL analytics, no Postgres overhead |
| **Groq** | Free 500k tokens/day, ultra-fast inference for live demos |
| **shadcn/ui** | Consistent components, team already uses it |
| **Recharts** | Team already uses it in aether2.0 |
| **TanStack Table** | Sortable/filterable contract tables |
| **Vercel** | Free frontend hosting, no credit card |

### What NOT to use
- No Postgres (DuckDB is sufficient for read-heavy analytics)
- No Qdrant/vector DB (not needed — structured data queries, not semantic search)
- No Supabase (no auth needed beyond a simple staff/public toggle)

---

## 4. Data Pipeline

### Sources

| Source | Format | Access | Columns |
|--------|--------|--------|---------|
| **City Contracts (xqn7-jvv2)** | CSV | Direct download | vendor, amount, start_date, end_date, department, contract_type + 3 more |
| **SAM.gov** | REST API | Free API key | federal contracts, vendor debarment |
| **eVA** | CSV | data.virginia.gov | state procurement data |

### Pipeline Steps (Friday evening)

1. Download City Contracts CSV (use CSV, not API — API has column bug)
2. Register SAM.gov API key, pull Richmond-area vendor/contract data
3. Download eVA CSV from data.virginia.gov
4. Python script: normalize dates, clean vendor names, compute days_to_expiry
5. Load all into DuckDB tables
6. Source 3–5 sample procurement PDFs from SAM.gov public awards or Richmond RFP archives

### Date Normalization
City Contracts CSV has inconsistent date formats. The ingestion script will:
- Parse dates with multiple format attempts (MM/DD/YYYY, YYYY-MM-DD, etc.)
- Calculate `days_to_expiry = end_date - today`
- Flag contracts with missing or unparseable dates

### Vendor Name Normalization
Cross-source vendor matching uses DuckDB's `jaro_winkler_similarity()`. For demo, scope to exact-match + top fuzzy matches. Do not overclaim cross-source matching accuracy.

---

## 5. Features

### 5.1 Staff View

**Contract Expiration Dashboard**
- TanStack Table with all contracts, sortable by expiry date, amount, department, vendor
- Filter presets: expiring in 30/60/90 days, high-value (>$100K), by department
- Color-coded risk: red (≤30 days), yellow (31–60), green (60+)
- Click a row to expand contract detail card

**PDF Key-Term Extractor**
- Upload a procurement PDF
- Backend extracts text via pypdf
- Groq LLM extracts structured fields: expiration_date, renewal_option, pricing_structure, key_conditions, parties
- Results displayed as a structured card alongside the original PDF
- Disclaimer: "AI-assisted extraction — verify against original document"
- Extraction schema is fixed (not user-configurable for MVP)

**Natural Language Query Bar**
- User types: "Show me all DPW contracts over $100K expiring this quarter"
- Backend translates to SQL via Groq, executes against DuckDB
- Returns table results + auto-generated chart suggestion
- Shows the generated SQL for transparency
- Fallback: if NL-to-SQL fails, show "Try a different query" with example prompts

**Risk Alerts Panel**
- Auto-generated alerts: contracts expiring in 30 days, high-value renewals upcoming
- Static on page load (not real-time push)

### 5.2 Public Transparency View

**Spending Explorer**
- Bar/pie charts: spending by department, by vendor, by year
- Trend line: year-over-year contract spending
- Filters: department, year range, contract type

**Vendor Explorer**
- Search vendors → see all contracts across City/SAM/eVA
- Vendor profile card: total contract value, number of contracts, departments served
- Cross-source indicator: "This vendor also appears in federal contracts"

**Contract Search**
- Full-text search across contract descriptions
- Plain-language contract summaries (pre-generated via LLM during data pipeline)
- Link to official Socrata source for each record

**Labeling**
- Every page: "Exploratory tool — not official City financial reporting"
- Data source and last-updated date on every visualization
- "Source: City of Richmond Open Data (Socrata)" badge on all City data

---

## 6. Patterns Borrowed From Existing Projects

| From | Component/Pattern | Adaptation |
|------|-------------------|------------|
| **aether2.0** | NL-to-SQL service | Swap Anthropic for Groq, target DuckDB instead of Postgres |
| **aether2.0** | Dashboard layout (react-grid-layout + Recharts) | Simplify to fixed layout with Recharts charts |
| **aether2.0** | CSV → DuckDB data loading | Reuse ingestion pattern for Socrata/eVA CSVs |
| **aether2.0** | Polars for data preprocessing | Use for date normalization and vendor cleaning |
| **notebookv2** | PDF text extraction (pypdf) | Reuse extraction logic, add structured LLM parsing |
| **notebookv2** | shadcn/ui component library + theming | Copy component patterns into new project |

These are pattern references, not direct imports. New code in a new repo.

---

## 7. Non-Goals

- No integration with RVA311, EnerGov, Oracle RAPIDS, or BizTalk
- No compliance determinations or contract award decisions
- No eligibility checks
- No authentication system (staff/public is a simple route toggle)
- No real-time data sync — data is loaded once during setup
- No VITA integration (web-only portal, no API)
- No mobile-optimized layout (desktop-first for staff use)

## 12. Accessibility & Inclusivity Requirements

**Target users include elderly residents, people with disabilities, and first-time internet users.**

- **WCAG 2.1 AA compliant** — minimum contrast ratios, keyboard navigable, screen reader friendly
- **ADA compliant** — all interactive elements accessible, ARIA labels on all controls
- **Large touch targets** — minimum 44x44px for all clickable elements
- **Clear typography** — minimum 16px body text, high-contrast color scheme
- **Plain language** — no jargon, no acronyms without explanation, reading level grade 8 or below
- **No cognitive overload** — progressive disclosure, one action per screen where possible
- **Visible focus indicators** — all keyboard-focusable elements show clear focus rings
- **Error prevention** — clear labels, helper text, forgiving input parsing
- **No motion dependency** — respect prefers-reduced-motion, no auto-playing animations
- **Color not sole indicator** — risk levels use icons + text + color, never color alone

---

## 8. Demo Script (3–5 minutes)

1. **The pain (45s):** "A procurement officer needs to review expiring contracts. Today: download a CSV, open Excel, manually sort by date, then hunt through 40-page PDFs for renewal terms. This takes hours."

2. **Staff dashboard (90s):** Dashboard loads with City contract data → apply "expiring in 60 days" filter → 8 contracts flagged red/yellow → click one to see details → upload its PDF → AI extracts key terms in 10 seconds → NL query: "Show me all contracts with [vendor] across all sources"

3. **Public transparency (45s):** Switch to public view → spending by department chart → click a vendor → see contract history across City and federal sources → "Residents can see where their tax dollars go"

4. **Credibility (30s):** "All data from public sources — City open data, SAM.gov, eVA. AI extraction is labeled advisory. Staff make the final call. We don't make compliance determinations."

5. **Close (15s):** "RVA Contract Lens: one view for staff risk management, one view for public accountability."

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No sample procurement PDFs | High | Blocks PDF demo | Source from SAM.gov public awards or Richmond RFP archives Friday evening |
| Socrata API column bug | Known | Low | Use CSV download (documented, already planned) |
| VITA has no API | Known | Low | Exclude from MVP; mention as "future integration" in pitch |
| Groq rate limits during live demo | Medium | High | Pre-cache common queries; have Mistral fallback configured |
| Vendor name mismatch across sources | Medium | Medium | Fuzzy match with jaro_winkler; scope to exact matches for demo |
| Inconsistent date formats in CSV | Medium | Medium | Multi-format parser in ingestion script; flag unparseable rows |
| DuckDB concurrency under demo load | Low | Low | Single-user demo; DuckDB handles this fine |

---

## 10. Build Sequence (Weekend Timeline)

### Friday Evening (after kickoff)
- Clone repo, scaffold Next.js + FastAPI project
- Download all CSVs, register SAM.gov API key
- Run data ingestion script → DuckDB loaded
- Source sample procurement PDFs
- Deploy frontend shell to Vercel

### Saturday (full day)
- Morning: Staff dashboard — expiry table, filters, risk alerts
- Midday: PDF extraction endpoint + upload UI
- Afternoon: NL-to-SQL query bar
- Evening: Public transparency view — charts, vendor explorer
- Submit by evening deadline

### Sunday (morning before finals)
- Polish demo flow
- Pre-cache demo queries
- Test on projector/screen resolution
- Practice 3-minute pitch

---

## 11. Success Criteria

- [ ] City Contracts CSV loaded and queryable in DuckDB
- [ ] Staff can filter contracts by expiry window (30/60/90 days)
- [ ] At least 1 PDF successfully extracted with structured output
- [ ] NL query returns correct SQL results for 3+ demo queries
- [ ] Public view shows spending charts with real data
- [ ] All data sources labeled with provenance
- [ ] "Advisory only" disclaimers on AI-generated content
- [ ] Demo runs end-to-end in under 4 minutes
