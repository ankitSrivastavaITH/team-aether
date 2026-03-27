# RVA Contract Lens — Business Plan

## Executive Summary

**RVA Contract Lens** is a dual-purpose civic technology tool that transforms how Richmond manages and communicates public spending. For City procurement staff, it replaces hours of manual CSV/PDF review with an intelligent dashboard that surfaces expiring contracts, extracts key terms from procurement documents, and answers natural language questions about contract data. For Richmond residents, it provides an unprecedented window into how $6.1 billion in public contracts are awarded, to whom, and when they expire.

**Target Awards:**
- **Pillar Award (Track 1):** Staff-facing procurement risk dashboard
- **Moonshot Award (People's Choice):** Public transparency explorer — "Where do your tax dollars go?"

---

## The Problem

### For City Staff
Richmond's procurement team manages 1,365+ contracts across multiple departments totaling $6.1B. To make informed purchasing decisions, staff must:

1. Download a CSV from the City's open data portal
2. Open it in Excel, manually sort and filter by dates
3. Cross-reference with SAM.gov (federal), eVA (state), and VITA (state IT) portals
4. Open 40-page procurement PDFs to find renewal windows, pricing terms, and conditions
5. Repeat for every contract review cycle

**Result:** Hours of manual work per cycle. Missed renewal windows. No unified view across City, state, and federal sources.

**Scale of the pain today:**
- 22 contracts expiring in the next 30 days
- 54 contracts expiring in the next 60 days
- 75 contracts expiring in the next 90 days
- No automated alerting for any of these

### For Residents
Richmond's $6.1B in public contracts is technically public data, but practically invisible. The raw CSV on the open data portal is unusable for anyone without data analysis skills. Residents have no way to:
- See which vendors receive the most public money
- Track spending trends by department over time
- Understand what contracts are active in their city
- Hold the City accountable for procurement decisions

---

## The Solution

### Staff View — Procurement Risk Dashboard

**Contract Expiration Tracker**
- Filterable table of all 1,365 contracts with color-coded risk levels
- Red (≤30 days), Yellow (31–60 days), Green (60+ days)
- Filter by department, vendor, value, procurement type
- One-click detail view for each contract

**AI-Powered PDF Extraction**
- Upload any procurement PDF
- AI extracts: expiration date, renewal window, pricing structure, key conditions, parties
- Results displayed as structured card alongside original document
- "AI-assisted extraction — verify against original document"

**Natural Language Query Bar**
- "Show me all Public Works contracts over $500K expiring this quarter"
- Translates to SQL, executes against contract database, returns table + chart
- Shows generated SQL for full transparency

**Risk Alerts**
- Auto-generated alerts for contracts expiring in 30 days
- High-value renewal notifications
- Department-level risk summary

### Public View — Transparency Explorer (Moonshot Play)

**"Where Do Your Tax Dollars Go?"**
- Interactive spending explorer: $6.1B visualized by department, vendor, year
- Click any department → see all contracts, top vendors, spending trends
- Click any vendor → see full contract history, cross-reference with federal data

**Vendor Accountability**
- Top vendors by total contract value
- Vendor diversity indicators
- Cross-source matching: "This vendor also holds $X in federal contracts"

**Plain-Language Contracts**
- Every contract described in simple English (AI-generated summaries)
- Full provenance: "Source: City of Richmond Open Data, last updated [date]"
- Link to official Socrata record for every entry

**Trust Architecture**
- Every visualization labeled with data source and date
- "Exploratory tool — not official City financial reporting"
- No claims of completeness or accuracy beyond what the data shows

---

## Moonshot Strategy

The **People's Choice / Moonshot Award** is won by audience vote. The audience is hackathon attendees — technologists, designers, community members, mentors, and city officials.

**Why the transparency view wins votes:**

1. **Universal appeal:** Everyone pays taxes. Everyone wants to know where the money goes.
2. **Visceral impact:** $6.1 BILLION displayed visually is immediately compelling.
3. **Interactive discovery:** Attendees can explore their own city's spending in real-time during the demo.
4. **Emotional resonance:** "Your city spends $810M on its largest contract. Do you know what it's for?"
5. **Civic pride:** Richmond's first civic hackathon producing Richmond's first spending transparency tool.

**Demo strategy for Moonshot:**
- Lead the pitch with the public view, not the staff view
- Open with a provocative data point from the real dataset
- Let the audience experience the tool during Q&A
- Close with: "This data was always public. We just made it visible."

---

## Market Context

### Comparable Tools
- **USASpending.gov** — Federal spending transparency (our inspiration, but for Richmond)
- **OpenGov** — Enterprise government transparency platform ($$$, not accessible to small cities)
- **Socrata Open Data** — Raw data platform (where our CSV lives, but no visualization layer)

### Gap We Fill
No city-level, citizen-facing spending transparency tool exists for Richmond. The data is on Socrata as a raw CSV download. We provide the visualization, search, and plain-language layer that makes it usable.

---

## Technical Architecture

```
Frontend: Next.js + shadcn/ui + Recharts + TanStack Table
Backend:  FastAPI + DuckDB (in-process, zero-config)
AI:       Groq (free 500k tokens/day)
Data:     City Contracts CSV + SAM.gov API + eVA CSV
Deploy:   Vercel (free) + local backend for demo
```

### Why This Stack
- **DuckDB over Postgres:** Zero setup, native CSV loading, analytical SQL — no database server needed
- **Groq over OpenAI/Anthropic:** Free tier, fastest inference for live demos
- **Vercel:** Free hosting, instant deploys, no credit card
- **No auth system:** Staff/public is a simple route toggle. Auth is a post-hackathon concern.

---

## Data Foundation

| Source | Records | Status |
|--------|---------|--------|
| City Contracts (Socrata CSV) | 1,365 | **Downloaded and validated** |
| SAM.gov | TBD | API key needed day-1 |
| eVA (Virginia) | TBD | CSV download day-1 |

### Key Metrics From Real Data
- $6.1B total contract value
- 15 departments represented
- 22 contracts expiring in 30 days
- Top vendor: Carahsoft Technology (24 contracts)
- Largest single contract: $810.6M
- Date range: 2011 to 2031+

---

## Build Timeline

### Friday (March 27) — Foundation
- Kickoff at VCU, get activation code
- Scaffold Next.js + FastAPI project
- Download all CSVs, register SAM.gov API key
- Run data ingestion → DuckDB loaded with all sources
- Source 3–5 sample procurement PDFs
- Deploy frontend shell to Vercel

### Saturday (March 28) — Build
- **Morning:** Staff dashboard — expiry table, filters, risk alerts
- **Midday:** PDF extraction endpoint + upload UI
- **Afternoon:** NL-to-SQL query bar
- **Evening:** Public transparency view — spending charts, vendor explorer
- Submit by evening deadline

### Sunday (March 29) — Demo
- Polish demo flow, pre-cache queries
- Test on projector resolution
- Practice 3-minute pitch
- Finals at 1:30 PM

---

## Pitch Structure (3 minutes)

### For Pillar Award judges:
1. **(30s) The pain:** "A procurement officer needs to review expiring contracts. Today: CSV → Excel → sort → scan PDFs. Hours per cycle."
2. **(90s) Staff dashboard:** Live demo — filter expiring contracts, upload PDF, AI extraction, NL query
3. **(30s) Credibility:** "Real City data. AI labeled advisory. Staff make the final call."

### For Moonshot voters:
1. **(30s) The hook:** "Richmond spends $6.1 billion in public contracts. Can you name a single one?"
2. **(90s) Transparency explorer:** Live demo — spending by department, click vendor, see history, cross-reference federal, plain-language summaries
3. **(30s) The close:** "This data was always public. We just made it visible. Vote for RVA Contract Lens."

---

## Post-Hackathon Vision

### Phase 1: Pilot (0–3 months)
- Partner with City procurement office for pilot
- Add real-time data refresh from Socrata
- User testing with actual procurement staff

### Phase 2: Expand (3–6 months)
- Add SAM.gov debarment cross-checking
- Build automated contract renewal reminders
- Add eVA and VITA integration
- Mobile-responsive public view

### Phase 3: Platform (6–12 months)
- Multi-city expansion (Virginia first)
- API for other civic tools to consume
- Integration with City procurement workflow (with official partnership)
- Historical trend analysis and predictive analytics

### Long-Term
Aligns with the hackathon's vision: evolve into a **civic innovation studio** that builds sustained institutional muscle for Richmond. RVA Contract Lens could become the procurement transparency layer for the city.

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| No sample PDFs available | Source from SAM.gov public awards or Richmond RFP archives |
| Groq rate limits during demo | Pre-cache common queries; Mistral fallback |
| Data quality issues | Multi-format date parser; flag unparseable rows |
| Vendor name mismatches across sources | Fuzzy matching; scope to exact matches for demo |
| Live demo failure | Pre-recorded backup; screenshot slides |

---

## Success Criteria

- [ ] City Contracts CSV loaded and queryable
- [ ] Staff can filter by expiry window (30/60/90 days)
- [ ] At least 1 PDF extracted with structured output
- [ ] NL query returns correct results for 3+ demo queries
- [ ] Public view shows spending charts with real data
- [ ] All data sources labeled with provenance
- [ ] "Advisory only" disclaimers on AI content
- [ ] Demo runs end-to-end in under 4 minutes
- [ ] Moonshot pitch lands the emotional hook

---

## Why We Win

1. **Real data, not synthetic:** Every number in our demo comes from Richmond's actual contract registry
2. **Dual value:** Staff efficiency + public accountability in one tool
3. **Technically sound:** Built on proven patterns (NL-to-SQL, PDF extraction, data viz)
4. **Ethically responsible:** Advisory only, disclaimers everywhere, no overclaiming
5. **Moonshot appeal:** "Where do your tax dollars go?" is a universal question with no current answer
6. **Feasibility:** Standard stack, public data, zero system dependencies — could be piloted within a year
7. **Aligned with the Mayor's Action Plan:** Directly addresses government efficiency and transparency
