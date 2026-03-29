# RVA Contract Lens — Demo Script (3 minutes)

## Before You Start
- Backend: running on port 8200
- Frontend: running on port 3200
- Staff code: rva2026
- Clear sessionStorage in browser (for welcome modal)
- Have these tabs ready:
  - Tab 1: http://localhost:3200 (landing)
  - Tab 2: http://localhost:3200/public/services (service navigator)
  - Tab 3: http://localhost:3200/staff (after login)

---

## [0:00-0:30] THE HOOK — Problem Statement

**Say:** "Richmond manages $6.76 billion in public contracts across 1,395 contracts, 4 government sources, and 15 departments. Right now, a procurement officer who needs to check expiring contracts downloads a CSV, opens Excel, manually sorts by date, then hunts through 40-page PDFs for renewal terms. The Deputy Director told us: it took him three days to renew one contract. Three days. And he almost lost the city's ability to defend its IT infrastructure because a contract term changed and nobody caught it."

**Show:** Landing page with animated $6.76B counter

---

## [0:30-1:00] PROBLEM 1 — Resident Service Navigation

**Say:** "But it's not just staff. Residents can't find the right city service either. There are 48 agencies, 50+ request types, and they overlap. The Deputy Director's favorite example..."

**Click:** Tab 2 → Service Navigator

**Type:** "there's a hole in the road in front of my house"

**Say:** "Watch — it doesn't just pick one category. It shows ALL the overlapping services: pothole, sinkhole, road damage, AND sidewalk repair. Because in city government, these are almost the same request handled by different departments. That overlap confusion is why requests get misdirected."

**Point out:** Confidence badge, next step, 3-1-1 fallback, overlapping services

**Type:** "I need to sign up for gas service"

**Say:** "Notice the safety warning — the current gas signup process asks residents to email personal information. Our tool flags that. We're not just routing requests, we're identifying process gaps."

---

## [1:00-2:00] PROBLEM 2 — Procurement Risk Dashboard

**Click:** Tab 3 → Staff Dashboard (code: rva2026)

**Say:** "Here's what the procurement officer sees. 22 contracts expiring in 30 days, $6.76 billion total. AI has already analyzed every expiring contract and generated specific recommendations."

**Click:** First risk alert (Mastec North America Inc, $79.7M)
**Say:** "Click any alert — AI recommendation says 'Rebid this contract, contact vendor about renewal terms.' That's what used to take 3 days of PDF scanning."

**Click:** Contracts in sidebar → filter "Expiring ≤30 days"
**Say:** "Filter to see all 22 critical contracts. Export to CSV with one click."

**Click:** PDF Analyzer in sidebar → select a sample PDF
**Say:** "Upload a contract PDF. AI extracts expiration dates, renewal terms, pricing, key conditions in 10 seconds. Then it's searchable."

**Type in search:** "renewal terms"
**Say:** "Every uploaded document is instantly searchable. 'What are the renewal terms?' — found in 2 seconds instead of 2 hours."

---

## [2:00-2:30] TRANSPARENCY + EQUITY

**Click:** Public View in sidebar

**Say:** "For residents: Where do your tax dollars go? $6.76 billion, visualized. Click any department, drill into any vendor. Available in Spanish."

**Click:** Español button
**Say:** "Richmond has a large Spanish-speaking community."

**Click:** back to English → MBE Analysis in sidebar
**Say:** "We analyze vendor diversity and flag departments with low MBE participation."

**Click:** Anomalies in sidebar
**Say:** "AI detects contract anomalies — expired contracts still active, price outliers, vendor concentration."

---

## [2:30-3:00] THE CLOSE

**Say:** "RVA Contract Lens. Both problem statements. Four data sources — City, Federal, State, and VITA. AI-powered analysis. WCAG accessible. Bilingual. Dark mode. Docker Compose for any city to deploy."

"The Deputy Director said: 'The City of Richmond is not the sole purveyor of needing such technology.' We agree. This works for any city with a Socrata open data portal."

"This data was always public. We just made it visible."

---

## JUDGE Q&A CHEAT SHEET

| Question | Answer |
|---|---|
| Is this real data? | Every number from City of Richmond Open Data, SAM.gov, Virginia eVA. Zero synthetic. |
| Does it integrate with City systems? | No — standalone, public data only. Can be piloted without IT approval. |
| What about compliance? | 7 federal exclusion lists referenced. SAM.gov debarment checked per vendor. Advisory only. |
| How accessible? | WCAG 2.1 AA. Spanish. 44px touch targets. Screen reader friendly. Designed for elderly and disabled residents. |
| Can other cities use this? | Yes. Docker Compose. DuckDB per city. Any Socrata dataset. Cost: essentially $0. |
| Could Pete Briel's 311 team pilot this? | Yes — the service navigator uses the same 311 categories his team manages. No new infrastructure needed. |
| What's the innovation? | Not a chatbot — a structured routing engine with NL-to-SQL, PDF vector search, contract anomaly detection, and MBE analysis. |
| What about the pothole/sinkhole overlap? | Our navigator shows ALL related categories simultaneously, not just one. Exactly the scenario the Deputy Director described. |
