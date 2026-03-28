# RVA Contract Lens

**AI-powered procurement decision intelligence for the City of Richmond.**

Built for Hack for RVA 2026 — Pillar 1: A Thriving City Hall

**Live Demo:** [hackrva.ithena.app](https://hackrva.ithena.app)

---

## What it does

RVA Contract Lens turns a 60-minute manual procurement review into an 8-second AI-powered decision brief — federating 8 real data sources, automating 7 federal compliance checks, and generating RENEW/REBID/ESCALATE verdicts with exportable decision memos.

### For procurement staff
- **AI Decision Engine** — analyzes contracts across 8 sources: contract details, vendor history, SAM.gov, FCC, OFAC, CISA, FBI, FTC, plus PDF intelligence and Google web search
- **Decision-first dashboard** — tells staff what needs attention today, this week, this month
- **Contract Health Scanner** — batch-grades all 37 departments A-F
- **OCR document extraction** — reads scanned PDFs (176K+ chars) via the unstructured library
- **Risk Score & Renewal Probability** — novel computed metrics on every contract
- **7 automated compliance checks** — 3 live API + 4 keyword screening

### For residents
- **Ask Richmond** — plain English questions about city contracts, powered by NL-to-SQL
- **Service Navigator** — routes questions to the right City department (20+ categories)
- **Transparency Dashboard** — $6.1B in spending across City, Federal, State, and VITA sources

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, shadcn, TanStack Query/Table, Recharts |
| Backend | FastAPI, Python 3.11 |
| Database | DuckDB (embedded analytics), ChromaDB (vector search) |
| AI/LLM | Groq (llama-3.3-70b-versatile), unstructured (OCR) |
| Deployment | Docker Compose, Cloudflare Tunnel |

## Data sources (all real, zero synthetic)

| Source | Records | Method |
|---|---|---|
| City of Richmond (Socrata) | 1,365 contracts ($6.1B) | CSV download → DuckDB |
| SAM.gov Federal | Live query | Opportunities API |
| FCC Covered List | 10+ entities | Keyword matching |
| Consolidated Screening List | 10+ entities | Keyword matching |
| Hackathon PDFs | 10 contracts (206 chunks) | OCR → ChromaDB |

## Quick start

```bash
# Clone
git clone https://github.com/ankitSrivastavaITH/team-aether.git
cd team-aether

# Run with Docker
docker-compose up

# Or run locally
cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8200
cd frontend && npm install && npm run dev -- -p 3200
```

Frontend: http://localhost:3200
Backend API: http://localhost:8200/docs

## Key metrics

- **1,365** real contracts, **$6.1B** total value
- **8** data sources in Decision Engine
- **7** automated compliance checks
- **147+** commits
- **31** pages, **40+** API endpoints
- **60 min → 8 sec** manual review time saved
- **176K** chars extracted from a single scanned PDF
- **1 person**, 48 hours

## Accessibility

- WCAG 2.1 AA compliant (Lighthouse 92/100)
- Atkinson Hyperlegible font (dyslexia-friendly)
- Bilingual EN/ES on staff dashboard
- High-contrast mode + font size toggle
- Focus trapping, skip links, 44px touch targets, prefers-reduced-motion

## Testing

```bash
cd backend && pytest tests/ -v
```

5 critical path tests covering health, contracts, compliance, health scan, and NL query.

## License

Built for Hack for RVA 2026 by Team Aether.

---

*AI-generated recommendations are advisory only. All procurement decisions require human review and approval.*
