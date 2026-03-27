# RVA Contract Lens

Richmond procurement transparency tool built for **Hack for RVA 2026**.

**Track 1: A Thriving City Hall** | Targeting Pillar Award + Moonshot (People's Choice)

## What It Does

- **Staff Dashboard**: Track expiring contracts, filter by department/risk, upload PDFs for AI extraction, ask questions in plain English
- **Public Transparency**: See where $6.1B in public contracts go — by department, by vendor, with plain-language summaries

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GROQ_API_KEY
python scripts/ingest.py  # Downloads and loads 1,365 City contracts
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000**

## Data Sources

| Source | Records | Status |
|--------|---------|--------|
| City Contracts (Socrata xqn7-jvv2) | 1,365 | Validated |
| SAM.gov | Federal contracts | API key needed |
| eVA (Virginia) | State procurement | CSV download |

## Tech Stack

- **Frontend**: Next.js 14, shadcn/ui, Recharts, TanStack Table
- **Backend**: FastAPI, DuckDB, ChromaDB
- **AI**: Groq (NL-to-SQL + PDF extraction)
- **Accessibility**: WCAG 2.1 AA compliant

## Accessibility

Built for everyone — including elderly residents and people with disabilities:
- High contrast (4.5:1 minimum)
- 44px touch targets
- Keyboard navigable
- Screen reader friendly
- Plain language, no jargon
- Risk shown with icon + text + color (never color alone)

## Disclaimer

Exploratory tool — not official City financial reporting. All data from public sources.

---

Built for Hack for RVA 2026 — *"This data was always public. We just made it visible."*
