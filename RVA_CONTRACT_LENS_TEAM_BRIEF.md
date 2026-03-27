# RVA Contract Lens — Team Brief

**Hack for RVA 2026 | March 27–29 | VCU School of Business**
**Track 1: A Thriving City Hall | Targeting: Pillar Award + Moonshot (People's Choice)**

---

## What We're Building

**RVA Contract Lens** — A dual-purpose civic tech app that helps City procurement staff manage contract risk AND gives Richmond residents transparency into $6.1B in public spending.

**One app. Two views. Two awards.**

---

## The Problem

### For City Staff
Procurement officers manage 1,365+ contracts ($6.1B) across 15 departments. To review expiring contracts, they:
1. Download a CSV from the open data portal
2. Open in Excel, manually sort by dates
3. Cross-reference SAM.gov, eVA, and VITA portals
4. Hunt through 40-page PDFs for renewal terms

**Right now, 22 contracts expire in 30 days. 54 in 60 days. No one gets an alert.**

### For Residents
$6.1B in public contracts is technically public data — but it's a raw CSV on Socrata. No visualization. No search. No plain-language descriptions. Practically invisible.

---

## The Solution

### Staff View — Procurement Risk Dashboard
| Feature | Description |
|---------|-------------|
| **Expiry Tracker** | Filterable table, color-coded: Red (≤30d), Yellow (31-60d), Green (60d+) |
| **PDF Extractor** | Upload contract PDF → AI extracts expiration, renewal, pricing, conditions |
| **NL Query Bar** | "Show me all DPW contracts over $500K expiring this quarter" → table + chart |
| **Risk Alerts** | Auto-generated: contracts expiring soon, high-value renewals |

### Public View — "Where Do Your Tax Dollars Go?"
| Feature | Description |
|---------|-------------|
| **Spending Explorer** | $6.1B visualized by department, vendor, year — interactive charts |
| **Vendor Explorer** | Click any vendor → full contract history, cross-reference federal data |
| **Contract Search** | Plain-language summaries, full provenance, links to official sources |
| **Trust Labels** | Every page: "Exploratory tool — not official City financial reporting" |

---

## Tech Stack

```
Frontend:  Next.js + shadcn/ui + Recharts + TanStack Table
Backend:   FastAPI + DuckDB (in-process, zero config)
AI:        Groq (free 500k tokens/day, ultra-fast)
Data:      City Contracts CSV + SAM.gov API + eVA CSV
Deploy:    Vercel (frontend) + local FastAPI (demo)
```

**Why these choices:**
- DuckDB → loads CSVs natively, analytical SQL, zero setup
- Groq → free tier, fastest inference for live demos
- Vercel → free, instant deploys
- No Postgres, no auth, no Supabase — keep it simple for a weekend

---

## Data (Validated)

| Source | Records | Status | URL |
|--------|---------|--------|-----|
| City Contracts CSV | 1,365 | **Downloaded & validated** | `data.richmondgov.com/api/views/xqn7-jvv2/rows.csv?accessType=DOWNLOAD` |
| SAM.gov | TBD | Need API key (free) | `api.sam.gov` |
| eVA (Virginia) | TBD | CSV download | `data.virginia.gov` |

**Key data points for the demo:**
- $6.1B total contract value
- 22 contracts expiring in 30 days
- Largest contract: $810.6M
- Top vendor: Carahsoft Technology (24 contracts)
- Top department: Public Utilities (399 contracts)
- Dates: 100% parseable, format `MM/DD/YYYY HH:MM:SS AM/PM`

**Do NOT use the Socrata API** — known bug returns only 8 of 9 columns. Use the CSV download.

---

## Build Timeline

### Friday 3/27 — Foundation (after kickoff)

| Task | Owner | Hours |
|------|-------|-------|
| Scaffold Next.js + FastAPI project | Dev | 1 |
| Download CSVs, register SAM.gov API key | Dev | 0.5 |
| Write data ingestion script (CSV → DuckDB) | Dev | 2 |
| Source 3-5 sample procurement PDFs | Research | 1 |
| Deploy frontend shell to Vercel | Dev | 0.5 |
| Set up project repo on GitHub | Dev | 0.5 |

**Friday exit criteria:** DuckDB loaded with all contract data, frontend shell live on Vercel.

### Saturday 3/28 — Build Day

| Time | Task | Priority |
|------|------|----------|
| 8-10 AM | Staff dashboard: expiry table + filters | **P0** |
| 10-12 PM | Risk alerts panel + contract detail view | **P0** |
| 12-2 PM | PDF extraction endpoint + upload UI | **P1** |
| 2-4 PM | NL-to-SQL query bar | **P1** |
| 4-6 PM | Public transparency view: spending charts | **P0** |
| 6-8 PM | Vendor explorer + contract search | **P1** |
| 8-10 PM | Polish, bug fixes, demo prep | **P0** |

**P0 = must have for demo. P1 = strong nice-to-have.**

**Saturday exit criteria:** Both views functional with real data. Submitted before deadline.

### Sunday 3/29 — Demo Day

| Time | Task |
|------|------|
| Morning | Polish demo flow, pre-cache queries |
| 11 AM | Test on projector/screen resolution |
| 12 PM | Practice pitch (3 min, timed) |
| 1:30 PM | Finals at VCU |

---

## Priority Stack (if we run out of time)

**Must ship (P0):**
1. Expiry tracker table with filters (the core value)
2. Spending charts in public view (the Moonshot hook)
3. Real data from City Contracts CSV

**Should ship (P1):**
4. PDF extraction
5. NL-to-SQL query bar
6. Vendor cross-reference with SAM.gov

**Nice to have (P2):**
7. eVA state data integration
8. AI-generated plain-language contract summaries
9. Department-level risk aggregation

---

## Pitch Structure (3 minutes)

### Pillar Award (judges)
| Time | Content |
|------|---------|
| 0:00-0:30 | **The pain:** "Procurement officers download CSVs, open Excel, scan PDFs. Hours per review cycle." |
| 0:30-2:00 | **Staff demo:** Filter expiring contracts → click one → upload PDF → AI extracts terms → NL query |
| 2:00-2:30 | **Credibility:** "Real City data. AI labeled advisory. Staff make the final call." |
| 2:30-3:00 | **Close:** "RVA Contract Lens: less time in spreadsheets, fewer missed renewals." |

### Moonshot (audience vote)
| Time | Content |
|------|---------|
| 0:00-0:30 | **The hook:** "Richmond spends $6.1 billion in public contracts. Can you name a single one?" |
| 0:30-2:00 | **Public demo:** Spending by department → click vendor → history → federal cross-reference |
| 2:00-2:30 | **Emotional close:** "This data was always public. We just made it visible." |
| 2:30-3:00 | **CTA:** "Vote for RVA Contract Lens." |

---

## Rules of Engagement

### We DO
- Use real, verified public data from Richmond's open data portal
- Label every AI output as "AI-assisted — verify against original"
- Link to official sources for every data point
- Say "Exploratory tool — not official City financial reporting" on every page
- Support staff judgment — never replace it

### We DO NOT
- Integrate with City systems (RVA311, EnerGov, Oracle RAPIDS)
- Make compliance or legal determinations
- Make contract award or eligibility decisions
- Claim the tool is authoritative or deployment-ready
- Use synthetic/fake data when real data exists
- Claim to "automate procurement" or "replace staff"

---

## Judging Rubric (max 105 points)

| Category | Weight | What judges ask | Our answer |
|----------|--------|-----------------|------------|
| **Impact** | 5x | Addresses the problem? | Direct hit on Problem 2 + Blue Sky |
| **User Value** | 4x | Real user, real improvement? | Procurement staff save hours; residents see spending |
| **Feasibility** | 3x | Could be piloted in a year? | Public data, standard stack, no dependencies |
| **Innovation** | 3x | Fresh thinking? | Dual staff+public view, NL queries, AI extraction |
| **Execution** | 3x | Working demo? | Real data, coherent flow, two complete views |
| **Equity** | 3x | Reaches underserved? | Public transparency for all residents |

**Tiebreaker:** User Value score.

---

## Post-Hackathon Roadmap

| Phase | Timeline | Goals |
|-------|----------|-------|
| **Pilot** | 0–3 months | Partner with City procurement, add real-time data refresh, user testing |
| **Expand** | 3–6 months | SAM.gov debarment checks, automated renewal reminders, mobile public view |
| **Platform** | 6–12 months | Multi-city expansion (Virginia), API for civic tools, City integration |
| **Vision** | 12+ months | Civic innovation lab — sustained procurement transparency for Richmond |

---

## Key Links

| Resource | URL |
|----------|-----|
| Pillar repo | `github.com/hack4rva/pillar-thriving-city-hall` |
| City Contracts CSV | `data.richmondgov.com/api/views/xqn7-jvv2/rows.csv?accessType=DOWNLOAD` |
| SAM.gov API | `api.sam.gov` |
| eVA data | `data.virginia.gov` |
| Hackathon site | `rvahacks.org` |
| Design spec | `docs/superpowers/specs/2026-03-27-rva-contract-lens-design.md` |
| Business plan | `docs/superpowers/specs/2026-03-27-rva-contract-lens-business-plan.md` |

---

## Contact

- Hackathon org: hello@rvahacks.org
- Team portal (for activation code): rvahacks.org/team-portal

---

*Built for Hack for RVA 2026. Track 1: A Thriving City Hall.*
*"This data was always public. We just made it visible."*
