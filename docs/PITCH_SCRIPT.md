# RVA Contract Lens — Pitch Script (3 Minutes)

**Hack for RVA 2026 | Track 1: A Thriving City Hall**
**Targeting: Pillar Award + Moonshot (People's Choice)**

---

## OPENING — THE HOOK [0:00–0:30]

"Richmond manages $6.76 billion in public contracts. 1,395 contracts. 4 government sources. 15 departments.

Right now, a procurement officer who needs to check expiring contracts downloads a CSV, opens Excel, manually sorts by date, then hunts through 40-page PDFs for renewal terms.

The Deputy Director told us it took him three days to renew one contract. Three days. And he almost lost the city's ability to defend its IT infrastructure because a contract term changed and nobody caught it.

We are RVA Contract Lens. And we built the tool that fixes both problems."

---

## PROBLEM 1 — RESIDENT SERVICE NAVIGATION [0:30–1:00]

"It's not just staff. Residents can't find the right city service either. 48 agencies. 50+ request types. They overlap in ways nobody explains.

The Deputy Director's favorite example: a resident calls 311 and says 'there's a hole in the road in front of my house.' Is that a pothole? A sinkhole? Road damage? A sidewalk issue? In city government, that's four different departments, four different workflows — and requests get misdirected every day.

[Demo: Service Navigator → type 'there's a hole in the road' → show overlapping results]

Our service navigator doesn't pick one answer. It shows ALL overlapping categories simultaneously — with confidence scores, next steps, and a 3-1-1 fallback. And watch what happens when someone searches for gas service signup — it flags that the current process asks residents to email personal information. We're not just routing requests. We're identifying process gaps.

The Deputy Director said this is exactly the scenario his team faces."

---

## PROBLEM 2 — PROCUREMENT RISK DASHBOARD [1:00–2:00]

"Now here's what the procurement officer sees when they log in.

[Demo: Staff dashboard — 22 contracts expiring in 30 days]

22 contracts expiring in 30 days. $6.1 billion under management. AI has already analyzed every expiring contract and generated specific recommendations.

[Click: Mastec North America Inc, $79.7M]

Click any alert — 'Rebid this contract, contact vendor about renewal terms.' That's what used to take three days of PDF scanning. It now takes three seconds.

[Filter: Expiring ≤30 days → Export CSV]

Filter to 22 critical contracts. Export with one click. No spreadsheet. No manual sort.

[PDF Analyzer → upload sample → type 'renewal terms']

Upload a contract PDF. AI extracts expiration dates, renewal terms, pricing, key conditions in under 10 seconds. Then it's searchable. 'What are the renewal terms?' Found in 2 seconds instead of 2 hours."

---

## TRANSPARENCY AND EQUITY [2:00–2:30]

"And for residents — where do your tax dollars actually go?

[Public view → spending visualization → Español button]

$6.76 billion, visualized. Click any department, drill into any vendor. Available in Spanish — because Richmond has a large Spanish-speaking community and civic transparency should not require English fluency.

[MBE Analysis → Anomalies]

We analyze vendor diversity and flag departments with low Minority Business Enterprise participation. And our anomaly detection catches expired contracts still marked active, price outliers, vendor concentration risks — the things that slip through in a spreadsheet."

---

## THE CLOSE [2:30–3:00]

"RVA Contract Lens. Both problem statements. Four data sources — City of Richmond, SAM.gov Federal, Virginia eVA, and VITA. AI-powered analysis. WCAG 2.1 AA accessible. Bilingual. Dark mode. One Docker Compose command to deploy.

The Deputy Director said: 'The City of Richmond is not the sole purveyor of needing such technology.' We agree. This works for any city with a Socrata open data portal.

Any city. Any data. One command to deploy. Essentially zero marginal cost.

This data was always public. We just made it visible."

---

## JUDGE Q&A — PREPARED ANSWERS

| Question | Answer |
|---|---|
| Is this real data? | Every number from City of Richmond Open Data, SAM.gov, Virginia eVA. Zero synthetic data. |
| Does it integrate with City systems? | No — standalone, public data only. Can be piloted without IT approval or procurement process. |
| What about compliance? | 7 federal exclusion lists referenced. SAM.gov debarment checked per vendor. Advisory only — staff make final decisions. |
| How accessible? | WCAG 2.1 AA. Spanish translation. 44px touch targets. Screen reader friendly. Designed for elderly and disabled residents. |
| Can other cities use this? | Yes. Docker Compose. DuckDB per city instance. Any Socrata dataset. Cost: essentially $0. |
| Could Pete Briel's 311 team pilot this? | Yes — the service navigator uses the same 311 categories his team manages. No new infrastructure needed. |
| What's the technical innovation? | Not a chatbot — a structured routing engine with NL-to-SQL query generation, PDF vector search, contract anomaly detection, and MBE analysis. |
| What about the pothole/sinkhole overlap? | Our navigator shows ALL related categories simultaneously with confidence scores — not just one answer. This is exactly the scenario the Deputy Director described as a daily pain point. |
| What's the stack? | Next.js frontend, FastAPI backend, DuckDB (zero-config analytics), Groq for LLM inference, ChromaDB for vector search. |
| What does it cost to run? | A single NL query costs $0.000135 in API fees. At 1,000 queries/day, that's $0.14/day. Essentially free until 10K+ daily queries. |

---

## PITCH PRINCIPLES

- **Lead with the Deputy Director's exact words** — "three days to renew one contract" and "not the sole purveyor" are quotable and real
- **Show, then explain** — run the demo click before narrating what it does
- **Say the numbers clearly** — $6.76 billion, 1,395 contracts, 22 expiring in 30 days
- **Never apologize for limitations** — the tool is advisory by design, not because it's incomplete
- **Close on the vision** — "any city, any data, one command to deploy" positions this beyond a hackathon project

---

## TIMING GUIDE

| Segment | Time | Beats |
|---|---|---|
| Hook + problem setup | 0:00–0:30 | The Deputy Director story. $6.76B. Three days. |
| Service navigator demo | 0:30–1:00 | Pothole overlap. Gas service safety flag. |
| Staff dashboard demo | 1:00–2:00 | 22 contracts. Mastec. PDF. Search. |
| Transparency + equity | 2:00–2:30 | Public view. Spanish. MBE. Anomalies. |
| Close | 2:30–3:00 | Four sources. Docker Compose. The line. |

---

*"This data was always public. We just made it visible."*
