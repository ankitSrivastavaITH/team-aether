# RVA Contract Lens

**AI-powered procurement intelligence for the City of Richmond.**

Built for [Hack for RVA 2026](https://rvahacks.org) | Pillar 1: A Thriving City Hall | Problem 2: Procurement Risk & Opportunity Review

**Live Demo:** [hackrva.ithena.app](https://hackrva.ithena.app)

---

## The Problem

City of Richmond procurement staff manage **1,365 contracts worth $6.1 billion** across 37 departments. Today, reviewing a single contract for renewal requires:

- Manually searching **multiple databases** (City, State VITA, Federal SAM.gov)
- Reading through **hundreds of pages** of PDF contract documents
- Checking **federal compliance lists** (FCC, DHS, FBI, FTC) one by one
- Comparing vendor pricing with **no centralized tool**
- Tracking expiration dates across **spreadsheets and emails**

> *"It took me three days to get through all the contract materials to make sure the exact same purchase I made from the year before was still valid. It wasn't."*
> — Deputy Director of IT Strategy, City of Richmond

**Result:** Missed renewals, expired contracts still in use, no visibility into vendor concentration risk, and millions in potential savings left on the table.

## The Solution

RVA Contract Lens transforms that 60-minute manual review into an **8-second AI-powered decision brief**. One platform serves two audiences:

### For City Procurement Staff

| Feature | What It Does |
|---|---|
| **AI Decision Engine** | Select a vendor and contract. The system aggregates 8 data sources, runs 3 federal compliance checks, and delivers a RENEW/REBID/ESCALATE verdict with an exportable decision memo. |
| **Decision-First Dashboard** | Shows what needs attention *today*, *this week*, and *this month* — not a data dump, but an action plan. |
| **Contract Health Scanner** | Grades all 37 departments A through F based on contract risk. Identifies anomalies and expiring contracts at a glance. |
| **What-If Savings Estimator** | Models the fiscal impact of rebidding concentrated contracts under conservative (5%), moderate (10%), and aggressive (15%) scenarios. Shows specific vendors to target and estimated savings per department. |
| **Portfolio Strategy Advisor** | AI-generated procurement strategy per department: how many contracts to renew, rebid, or escalate — with projected savings and equity context. |
| **Decision Audit Timeline** | Every AI decision is recorded. Builds institutional memory so the next procurement officer inherits data-driven context, not a blank slate. |
| **PDF Analyzer** | Upload a scanned contract PDF. OCR extracts the full text, then AI identifies key terms: value, expiration, renewal clauses, and parties. |
| **Ask Richmond** | Type a question in plain English ("Show me expiring IT contracts over $100K"). AI translates it to a database query and returns results instantly. |
| **Vendor Concentration Risk** | HHI analysis identifies departments over-dependent on single vendors. Flags monopoly risk before it becomes a crisis. |
| **MBE & Supplier Diversity** | Tracks vendor diversity ratios by department, small business participation, and competitive bidding rates. Equity context is embedded in every Decision Engine analysis. |

### For Richmond Residents

| Page | What Residents See |
|---|---|
| **Overview** | Plain-language introduction to how Richmond spends public money. |
| **Spending** | Interactive breakdown of $6.1B in contracts by department, with charts. |
| **Vendors** | Who gets city contracts, how much, and how often. Click any vendor for detail. |
| **Department Detail** | Drill into any department's contract portfolio. |
| **Find a Service** | Routes questions to the right City department (20+ categories). |
| **Data Sources** | Where the data comes from — a transparency and trust signal. |

> Residents can see where $6.1B in contracts goes — by vendor, department, or service — without filing a FOIA request.

## How the AI Decision Engine Works

```
Staff selects vendor + contract
         |
         v
    +-----------+
    | 8 Sources |
    +-----------+
    | 1. Contract details (DuckDB)
    | 2. Vendor history (all contracts for this vendor)
    | 3. SAM.gov compliance (live federal API)
    | 4. FCC Covered List (prohibited manufacturers)
    | 5. Consolidated Screening List (DHS/FBI/FTC)
    | 6. Vendor concentration risk (HHI by department)
    | 7. PDF contract terms (OCR + semantic search)
    | 8. Vendor web intelligence (DuckDuckGo public info)
         |
         v
    +------------------+
    | Groq LLM Analysis|
    | (llama-3.3-70b)  |
    +------------------+
         |
         v
    +---------------------------+
    | 3-Layer Output            |
    | 1. Traffic light verdict  |
    |    (RENEW/REBID/ESCALATE) |
    | 2. Evidence grid          |
    |    (pros + cons + sources)|
    | 3. Exportable memo        |
    |    (copy/print ready)     |
    +---------------------------+
         |
         v
    +----------------------------+
    | AI Transparency Layers     |
    | - Data Analyzed (all 8)    |
    | - Confidence Breakdown     |
    |   (+20 Compliance Clear,   |
    |    -15 Price Increasing)   |
    | - Similar Contracts        |
    | - Web Intelligence         |
    | - Equity & MBE Context     |
    +----------------------------+
         |
         v
    Decision saved to audit trail (DuckDB)
```

**The AI recommends. Humans decide.** Every verdict includes full transparency into what the AI saw and why, so staff can verify before acting.

## Data Sources (All Real, Zero Synthetic)

| Source | Records | Method | Update Frequency |
|---|---|---|---|
| City of Richmond (Socrata) | 1,365 contracts ($6.1B) | CSV download | Real-time available |
| SAM.gov Federal | Live query | Opportunities API | Real-time |
| eVA Virginia State | Seeded | State procurement data | Periodic |
| VITA IT Contracts | Seeded | State IT procurement | Periodic |
| FCC Covered List | 10+ entities | Keyword matching | Updated with FCC releases |
| Consolidated Screening List | 10+ entities | Keyword matching | Updated with federal releases |
| Hackathon PDFs | 10 contracts (206 chunks) | OCR via `unstructured` | On upload |
| DuckDuckGo Web Intel | Live search | HTML scraping | Real-time |

## Accessibility & Equity

RVA Contract Lens is designed to work for **everyone**, not just the easiest users:

- **Bilingual EN/ES** across all staff pages (30+ translated strings)
- **Atkinson Hyperlegible** font — designed for low-vision and dyslexia accessibility
- **Font size toggle** (A, A+, A++) and **high-contrast mode** on both staff and public pages
- **Skip links** on every page (bilingual) for keyboard and screen reader users
- **44px minimum touch targets** throughout, with `prefers-reduced-motion` support
- **MBE/equity context** embedded in the AI Decision Engine — not a separate page, but part of every analysis
- **Public transparency view** so residents with any level of digital literacy can explore city spending

## Quick Start

```bash
# Clone
git clone https://github.com/ankitSrivastavaITH/team-aether.git
cd team-aether

# Backend
cd backend
pip install -r requirements.txt
echo "GROQ_API_KEY=your_key_here" > .env    # Get free key at console.groq.com
python -m uvicorn app.main:app --port 8200 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev -- -p 3200
```

- Frontend: http://localhost:3200
- Backend API docs: http://localhost:8200/docs
- Get a free Groq API key at [console.groq.com](https://console.groq.com)

## By the Numbers

| Metric | Value |
|---|---|
| Real contracts analyzed | 1,365 ($6.1B) |
| Data sources in Decision Engine | 8 |
| Federal compliance checks | 3 automated (SAM.gov, FCC, CSL) |
| Staff pages | 23 |
| Public transparency pages | 7 |
| API endpoints | 40+ |
| Commits | 152+ |
| Total codebase | Built by 1 person in 48 hours |
| Manual review time saved | 60 min → 8 sec per contract |
| OCR extraction capacity | 176K+ chars from a single scanned PDF |

---

## Full System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA INGESTION LAYER                          │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│   Socrata    │   SAM.gov    │  eVA / VITA  │  PDF Upload  │  Web Scrape│
│   CSV API    │Opportunities │  State CSV   │  (contract   │ DuckDuckGo │
│  1,365 rows  │   Live API   │   Seeded     │  documents)  │   Lite     │
│   ($6.1B)    │              │              │              │            │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┘
       │              │              │              │             │
       v              v              v              v             v
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROCESSING LAYER                               │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  CSV → DuckDB    │  │   OCR Pipeline   │  │  Compliance Engine   │  │
│  │  Ingest scripts  │  │  `unstructured`  │  │                      │  │
│  │  (pandas/polars) │  │  library         │  │  SAM.gov API (live)  │  │
│  │                  │  │  176K+ chars     │  │  FCC Covered List    │  │
│  │  city_contracts  │  │  per document    │  │  Consolidated Screen │  │
│  │  state_contracts │  │       │          │  │  List (DHS/FBI/FTC)  │  │
│  │  vita_contracts  │  │       v          │  │                      │  │
│  └────────┬─────────┘  │  Chunking +      │  └──────────┬───────────┘  │
│           │            │  Embedding        │             │              │
│           │            └────────┬──────────┘             │              │
│           │                     │                        │              │
└───────────┼─────────────────────┼────────────────────────┼──────────────┘
            │                     │                        │
            v                     v                        v
┌─────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                 │
│                                                                        │
│  ┌──────────────────────────┐    ┌──────────────────────────────────┐  │
│  │       DuckDB             │    │          ChromaDB                │  │
│  │   (Embedded Analytics)   │    │       (Vector Store)             │  │
│  │                          │    │                                  │  │
│  │  city_contracts (1,365)  │    │  pdf_chunks (206 embeddings)    │  │
│  │  state_contracts         │    │  semantic similarity search     │  │
│  │  vita_contracts          │    │  used by Decision Engine for    │  │
│  │  extracted_terms (9)     │    │  contract term cross-reference  │  │
│  │  decisions (audit trail) │    │                                  │  │
│  │                          │    │                                  │  │
│  └──────────────────────────┘    └──────────────────────────────────┘  │
│                                                                        │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────┐
│                     FastAPI BACKEND (12 Routers)                       │
│                                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │
│  │  /contracts  │ │  /decision  │ │  /strategy  │ │  /health-scan   │ │
│  │  CRUD,search │ │  8-source   │ │  What-If    │ │  Portfolio      │ │
│  │  filter,dept │ │  AI engine  │ │  Portfolio   │ │  grades A-F    │ │
│  │  vendor API  │ │  + verdicts │ │  Audit trail│ │  risk dist      │ │
│  └─────────────┘ └──────┬──────┘ └─────────────┘ └─────────────────┘ │
│  ┌─────────────┐        │        ┌─────────────┐ ┌─────────────────┐ │
│  │  /nl-query   │        │        │  /extract   │ │  /mbe           │ │
│  │  NL → SQL   │        │        │  PDF upload  │ │  Diversity      │ │
│  │  plain Eng  │        │        │  OCR + AI    │ │  analysis       │ │
│  │  to DuckDB  │        │        │  extraction  │ │  + anomalies    │ │
│  └─────────────┘        │        └─────────────┘ └─────────────────┘ │
│  ┌─────────────┐        │        ┌─────────────┐ ┌─────────────────┐ │
│  │  /analytics  │        │        │  /insights  │ │  /services      │ │
│  │  charts,     │        │        │  AI risk    │ │  Service        │ │
│  │  trends      │        │        │  summaries  │ │  navigator      │ │
│  └─────────────┘        │        └─────────────┘ └─────────────────┘ │
│                          │                                            │
└──────────────────────────┼────────────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI / LLM LAYER (Groq)                             │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │                    Groq Cloud API                                  ││
│  │              llama-3.3-70b-versatile                               ││
│  │                                                                    ││
│  │  Input: 8-source data context (JSON)                              ││
│  │  Output: Structured JSON verdict                                  ││
│  │    {                                                              ││
│  │      verdict: "RENEW" | "REBID" | "ESCALATE",                    ││
│  │      confidence: "HIGH" | "MEDIUM" | "LOW",                      ││
│  │      pros: [{point, evidence, source}],                          ││
│  │      cons: [{point, evidence, source}],                          ││
│  │      memo: "## Executive Summary ..."                            ││
│  │    }                                                              ││
│  │                                                                    ││
│  │  Also used for: NL-to-SQL, risk summaries, contract extraction   ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  Fallback: Regex extraction from malformed JSON                       │
│  Model cascade: 70b → 8b-instant if rate limited                     │
│                                                                        │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                              │
│                                                                        │
│  ┌──────────────────────┐       ┌──────────────────────────────────┐  │
│  │   STAFF VIEW (23pg)  │       │    PUBLIC VIEW (7 pages)         │  │
│  │                      │       │                                  │  │
│  │  Dashboard           │       │  Overview (spending summary)     │  │
│  │  Decision Engine     │       │  Spending (dept breakdown)       │  │
│  │  Health Scanner      │       │  Vendors (top vendors list)      │  │
│  │  What-If Savings     │       │  Vendor Detail (drill-down)      │  │
│  │  Portfolio Strategy  │       │  Department Detail               │  │
│  │  Decision Audit      │       │  Find a Service (navigator)     │  │
│  │  Contracts Table     │       │  Data Sources (trust signal)     │  │
│  │  PDF Analyzer (OCR)  │       │                                  │  │
│  │  Ask Richmond (NL)   │       │  Accessibility:                  │  │
│  │  Vendor Risk (HHI)   │       │  - Font size toggle              │  │
│  │  MBE Analysis        │       │  - High contrast mode            │  │
│  │  Analytics/Charts    │       │  - Bilingual EN/ES               │  │
│  │  Cost Analysis       │       │  - Skip links                    │  │
│  │  + 10 more pages     │       │  - 44px touch targets            │  │
│  │                      │       │                                  │  │
│  │  UI: shadcn/ui       │       │  Font: Atkinson Hyperlegible     │  │
│  │  Data: TanStack Query│       │  Charts: Recharts                │  │
│  │  i18n: EN/ES         │       │                                  │  │
│  └──────────────────────┘       └──────────────────────────────────┘  │
│                                                                        │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT                                        │
│                                                                        │
│  Docker Compose (backend:8200 + frontend:3200)                        │
│          │                                                             │
│          v                                                             │
│  Cloudflare Tunnel                                                    │
│    hackrva.ithena.app     → frontend (Next.js)                        │
│    api-hackrva.ithena.app → backend  (FastAPI)                        │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technical Architecture

### Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, shadcn/ui, TanStack Query/Table, Recharts | Fast SSR, component library, real-time data fetching |
| Backend | FastAPI (Python 3.11), 12 routers | Async support, auto-generated API docs, fast development |
| Analytics DB | DuckDB (embedded) | In-process OLAP — no database server needed, handles 1M+ rows |
| Vector DB | ChromaDB | Semantic search over OCR'd PDF chunks |
| AI/LLM | Groq (llama-3.3-70b-versatile) | Free tier, fast inference (< 2 sec), structured JSON output |
| OCR | `unstructured` library | Handles scanned PDFs, images, and mixed-format documents |
| Deployment | Docker Compose + Cloudflare Tunnel | Zero-infrastructure demo deployment |

### Backend Routers (12)

| Router | Prefix | Purpose |
|---|---|---|
| `contracts` | `/api/contracts` | CRUD, search, filter, department/vendor detail |
| `decision` | `/api/decision` | 8-source AI Decision Engine + verdict persistence |
| `strategy` | `/api/strategy` | What-If, Portfolio Strategy, Decision Audit Timeline |
| `health_scan` | `/api/health-scan` | Portfolio-wide health scoring and dept grades |
| `analytics` | `/api/analytics` | Spending trends, expiry forecasts, procurement types |
| `insights` | `/api/insights` | AI-generated risk summaries |
| `nl_query` | `/api/nl-query` | Natural language to SQL translation |
| `extract` | `/api/extract` | PDF upload, OCR, and AI term extraction |
| `parser` | `/api/parser` | Contract document parsing and ChromaDB ingestion |
| `mbe` | `/api/mbe` | MBE/supplier diversity analysis + anomaly detection |
| `services` | `/api/services` | Service category routing (20+ categories) |

### Frontend Pages (30)

**Staff (23 pages):** Dashboard, Health Scanner, All Contracts, Decision Engine, What-If Savings, Portfolio Strategy, Decision Audit, Vendor Risk (HHI), Anomalies, MBE Analysis, PDF Analyzer, Contract Intel, Charts & Trends, Dept Scorecards, Cost Analysis, Timeline, Ask Richmond, Compliance, Renewals, Review, Report, Compare Vendors, Alerts

**Public (7 pages):** Overview, Spending, Vendors, Vendor Detail, Department Detail, Find a Service, Data Sources

### Key Technical Decisions

| Decision | Rationale |
|---|---|
| DuckDB over PostgreSQL | Embedded analytics — zero ops, sub-second queries on 1,365 contracts, no server to manage |
| Groq over OpenAI | Free tier (500K tokens/day), fast inference, good JSON output from llama-3.3-70b |
| ChromaDB for PDF search | Lightweight vector DB, persistent storage, semantic similarity on OCR chunks |
| FastAPI over Flask | Async support critical for parallel compliance checks (SAM.gov + FCC + CSL concurrent) |
| shadcn/ui over Material | Accessible by default, composable, Tailwind-native, small bundle size |
| DuckDuckGo Lite over Google | Google blocks HTML scraping; DDG Lite returns parseable HTML results |

## Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Groq free tier rate limits | AI Decision Engine may timeout under heavy concurrent use | 5-second pacing between calls during demo; upgrade to paid tier for production |
| SAM.gov Exclusions API requires Entity Management role | Cannot check debarment directly | Using Opportunities API as proxy; apply for Entity Management access for production |
| Trade.gov CSL API retired | Consolidated Screening List check uses offline keyword matching | Monitor for API replacement; current keyword list covers primary entities |
| DuckDuckGo web search ~3-5 seconds | Adds latency to Decision Engine analysis | Results cached; runs in parallel with other checks |
| MBE status not in public contract data | Cannot definitively identify MBE-certified vendors | Analyze diversity ratios and small business participation as proxy indicators |
| PDF OCR accuracy varies | Scanned documents with poor quality may extract incomplete text | Uses `unstructured` with multiple parsing strategies; manual review always available |

## Future Roadmap

If piloted by the City, the following enhancements would maximize impact:

| Phase | Feature | Value |
|---|---|---|
| **Pilot (0-3 months)** | Connect to City's internal contract management system | Eliminate manual CSV imports, real-time data |
| | Add SAM.gov Entity Management API access | Full debarment checking, not just opportunities |
| | Expand PDF corpus | Ingest all active contract PDFs for comprehensive term extraction |
| **Scale (3-6 months)** | Multi-city deployment | Same platform, different Socrata dataset ID — works for any city with open data |
| | Email/calendar integration | Auto-alert procurement officers 90/60/30 days before expiration |
| | Vendor self-service portal | Vendors update their own MBE certifications, contact info, and capabilities |
| **Transform (6-12 months)** | Predictive risk scoring | ML model trained on historical contract outcomes to predict which contracts will have problems |
| | Cross-jurisdiction price benchmarking | Compare Richmond's contract prices against other Virginia cities and state rates |
| | Automated RFP generation | AI drafts request-for-proposal documents from contract requirements |
| | Legislative compliance tracking | Monitor Virginia procurement law changes and flag affected contracts |

## Testing

```bash
cd backend && pytest tests/ -v
```

5 critical path tests covering health check, contracts API, compliance endpoints, health scanner, and NL query.

## Team

Built by **Team Aether** (solo participant) for Hack for RVA 2026.

---

*AI-generated recommendations are advisory only. All procurement decisions require human review and approval per City of Richmond procurement policy.*
