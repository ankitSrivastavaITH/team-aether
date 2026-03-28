# RVA Contract Lens — NotebookLM Source Document

**Feed this entire document into NotebookLM to generate a podcast-style audio overview of the product.**

---

## Product Overview

RVA Contract Lens is an AI-powered procurement intelligence platform built for the City of Richmond, Virginia. It was created in 48 hours by a team of 4 for the Hack for RVA 2026 civic hackathon. The live demo is at hackrva.ithena.app.

The platform solves a real problem: Richmond manages over six and a half billion dollars in public contracts across 37 departments, but reviewing a single contract for renewal currently takes days of manual work — searching multiple databases, reading hundreds of pages of PDF documents, and checking federal compliance lists one by one.

The Deputy Director of IT Strategy for the City of Richmond described the problem firsthand: "It took me three days to get through all the contract materials to make sure the exact same purchase I made from the year before was still valid. It wasn't. We almost pushed ourselves out of the ability to defend city technology infrastructure because a contract term changed."

RVA Contract Lens turns that three-day manual review process into an eight-second AI-powered decision brief.

---

## Two Audiences, One Platform

The platform serves two distinct user groups through separate views:

### Staff View — 23 Pages of Procurement Intelligence

The staff side has 23 pages organized into six sections: Strategy, Risk & Equity, Procurement, AI Tools, Analytics, and a central Dashboard. Here is what each key feature does:

**The Staff Dashboard** is the first thing a procurement officer sees. It's not a data dump — it's an action plan organized into three urgency lanes: "Decide Today" shows contracts expiring this week that need immediate attention. "Plan This Week" shows contracts coming due in the next 30 to 60 days. "Review This Month" covers the 60 to 90 day horizon. Every contract card links directly to the AI Decision Engine.

[Screenshot reference: demo-screenshots/02-dashboard.png — Shows three-column layout with urgency lanes, contract cards with vendor names, values, and days remaining]

**The AI Decision Engine** is the core feature. A procurement officer selects a vendor and contract. The system then aggregates eight real data sources simultaneously: contract details from the city database, full vendor history across all departments, live SAM.gov federal compliance checks, FCC prohibited manufacturers list, DHS/FBI/FTC consolidated screening list, vendor concentration risk analysis using the HHI index, PDF contract terms extracted via OCR and semantic search, and public web intelligence about the vendor from DuckDuckGo.

In eight seconds, it returns a verdict — RENEW, REBID, or ESCALATE — with a confidence score. But what makes this different from a chatbot or generic AI tool is the transparency layer. Staff can see exactly what the AI analyzed: a confidence breakdown with signed impact factors like "+20 for Compliance Clear" and "-15 for Price Increasing." There's an evidence grid showing reasons to renew and reasons to rebid, each with the data source cited. Every decision is saved to an audit trail in the database.

The AI recommends. The human decides. Always.

[Screenshot reference: demo-screenshots/03-decision-engine.png — Shows vendor selector, contract dropdown, and the analysis results with verdict badge, confidence breakdown, and evidence grid]

**The What-If Savings Estimator** is where the platform goes beyond being a dashboard. It models the fiscal impact of rebidding the city's most concentrated contracts under three scenarios: conservative at 5 percent savings, moderate at 10 percent, and aggressive at 15 percent. Each scenario shows specific vendors to target, projected savings per department, and actionable recommendations with buttons that link directly to the Decision Engine for that vendor.

For example, the system might identify that CIGNA Healthcare holds 80.8 percent of Human Resources department spending worth 185 million dollars, and recommend rebidding with a projected savings of 18.5 million at the moderate scenario.

[Screenshot reference: demo-screenshots/05-what-if.png — Shows three scenario selector cards, projected savings bar, AI recommendations with priority badges and action buttons]

**The Portfolio Strategy Advisor** generates AI-driven procurement strategy for every department. For each department it shows: how many contracts to renew, how many to rebid, how many need immediate escalation, projected savings, vendor diversity score, and specific action items. For example, Public Utilities has 204 expired contracts that need immediate review, and the system tells staff exactly what to do about each category.

This is institutional memory. When a procurement officer leaves, the next person inherits data-driven context, not a blank slate.

[Screenshot reference: demo-screenshots/06-portfolio.png — Shows department strategy cards grouped by risk level with breakdown bars and expandable action items]

**The Decision Audit Timeline** records every AI decision as a timeline. It shows institutional memory building over time: verdict breakdown statistics, total contract value analyzed, most analyzed departments, pattern analysis insights, and the chronological timeline of all decisions with color-coded verdict badges.

[Screenshot reference: demo-screenshots/07-audit.png — Shows timeline with color-coded entries, stats cards, and pattern analysis section]

**The Contract Health Scanner** grades all 37 departments from A through F based on contract risk. It includes an expiry forecast showing contracts expiring in the next 30, 60, and 90 days with dollar values. It flags top anomalies like expired high-value contracts and vendor concentration risks, each with remediation steps.

[Screenshot reference: demo-screenshots/04-health-scanner.png — Shows health score ring, expiry forecast cards, risk distribution bar, and department grade cards]

**Vendor Concentration Risk** uses the Herfindahl-Hirschman Index — the same metric the Department of Justice uses to evaluate market concentration in mergers. The platform applies it to city procurement: below 1,500 is healthy competition, between 1,500 and 2,500 is moderate concentration, above 2,500 is monopoly risk. Each department gets a card showing its top vendors and concentration percentage.

[Screenshot reference: demo-screenshots/08-risk.png — Shows HHI explainer card and department concentration cards with percentage bars]

**MBE and Supplier Diversity Analysis** tracks vendor diversity ratios by department, small business participation rates, procurement method distribution, and competitive bidding percentages. But equity isn't isolated on this one page — it's embedded in the Decision Engine itself. When staff analyze any contract, they see the department's vendor diversity score and a specific equity note about whether to seek MBE vendors.

[Screenshot reference: demo-screenshots/09-mbe.png — Shows KPI stat cards, vendor diversity chart by department, procurement methods breakdown, and AI diversity insights]

**The PDF Analyzer** handles scanned contract documents. Staff upload a PDF and the OCR engine extracts the full text — up to 176,000 characters from a single document. Then AI identifies key terms: contract value, expiration dates, renewal clauses, and party names. The extracted terms are stored in ChromaDB for semantic search, so the Decision Engine can cross-reference contract language.

[Screenshot reference: demo-screenshots/10-pdf-analyzer.png — Shows file upload area, ingested documents list with extraction details]

**Ask Richmond** is a natural language query interface. Staff type a question in plain English like "Show me expiring IT contracts over 100 thousand dollars" and the AI translates it into a DuckDB SQL query and returns results instantly with a data table and follow-up question suggestions.

[Screenshot reference: demo-screenshots/11-ask-richmond.png — Shows query input bar with example questions]

**The Anomaly Detection page** maps anomalies on a risk matrix by severity and likelihood. Each anomaly type has specific remediation steps. The matrix uses the same severity and likelihood classifications used in enterprise risk management.

[Screenshot reference: demo-screenshots/14-anomalies.png — Shows risk matrix grid, anomaly cards with remediation steps]

**The All Contracts table** shows all 1,365 contracts in a searchable, sortable, filterable table with mobile-responsive card layouts. Click any contract to analyze it in the Decision Engine.

[Screenshot reference: demo-screenshots/15-contracts.png — Shows data table with columns for vendor, department, value, dates, risk level]

### Public View — 7 Pages of Fiscal Transparency

The public side serves Richmond residents who want to understand how their tax dollars are spent.

**The Public Overview** answers the question: "Where do your tax dollars go?" It shows total contract value, number of contracts, active vendors, top spending departments, and expiring contracts — all in plain language designed for residents with any level of digital literacy.

[Screenshot reference: demo-screenshots/12-public-overview.png — Shows hero heading, key metric cards, spending insights]

**The Spending page** provides interactive breakdowns by department with charts. Click any department to see their full portfolio. Click any vendor to see their contract history across the city.

[Screenshot reference: demo-screenshots/13-public-spending.png — Shows department spending charts, vendor lists, trend data]

Additional public pages include vendor directory with drill-down detail pages, department detail pages, Find a Service which routes questions to the right city department across 20 categories, and a Data Sources page that explains where all the data comes from — a transparency trust signal.

---

## Accessibility and Equity

The platform is designed to work for everyone, not just the easiest users. Every page includes a persistent accessibility toolbar with five controls:

[Screenshot reference: demo-screenshots/16-accessibility-toolbar.png — Shows toolbar with Public View, A++, HC (high contrast), Espanol, Dark, and Logout buttons]

Font size scaling cycles through three levels: A (default), A+ (medium), and A++ (large). High-contrast mode increases all text and border contrast for low-vision users. The Spanish toggle switches all staff page content to Spanish — over 30 translated interface strings. Dark mode reduces eye strain in low-light environments. These controls are available to both staff and the public.

The font throughout the entire platform is Atkinson Hyperlegible, specifically designed by the Braille Institute for people with low vision and dyslexia. Every interactive element has a minimum touch target of 44 pixels. Every page has bilingual skip links for keyboard and screen reader navigation. All animations respect the user's prefers-reduced-motion system setting.

Equity is not a separate feature — it's woven into the platform. The Decision Engine includes an Equity and Supplier Diversity section in every analysis, showing the department's vendor diversity score and a contextual recommendation about MBE vendors. The public transparency view ensures that residents don't need to file a FOIA request to understand city spending.

---

## The Data — All Real, Zero Synthetic

Every number in the platform comes from real public data:

- 1,365 city contracts worth 6.1 billion dollars from the City of Richmond's Socrata open data portal
- Live federal compliance data from the SAM.gov Opportunities API
- Virginia state contracts from eVA, the state's electronic procurement marketplace
- VITA statewide IT contracts
- 10 hackathon contract PDFs processed through OCR, producing 206 semantic search chunks in ChromaDB
- Federal compliance lists: FCC Covered List, DHS/FBI/FTC Consolidated Screening List
- Live vendor web intelligence from DuckDuckGo public search results

No synthetic data. No mock APIs. No internal city system access required.

---

## Technical Architecture

The platform runs on a modern stack optimized for speed and zero-infrastructure deployment:

Frontend: Next.js 14 with React 18, Tailwind CSS, shadcn/ui components, TanStack Query for data fetching, TanStack Table for sortable data grids, and Recharts for analytics visualizations.

Backend: FastAPI with Python 3.11, organized into 12 API routers serving 40+ endpoints. Key capabilities include async parallel compliance checks, rate limiting, decision persistence, and robust JSON fallback parsing for LLM responses.

Databases: DuckDB for embedded analytics (in-process, no database server needed, sub-second queries on the full contract dataset) and ChromaDB for vector-based semantic search over OCR-extracted PDF content.

AI: Groq cloud API running llama-3.3-70b-versatile as the primary model with llama-3.1-8b-instant as a rate-limit fallback. Used for four functions: Decision Engine verdicts, natural language to SQL translation, contract term extraction from PDFs, and risk summary generation.

OCR: The unstructured library handles scanned PDFs, extracting up to 176,000 characters from a single document.

Deployment: Docker Compose with Cloudflare Tunnel — zero infrastructure required for the demo.

The codebase has over 155 commits, 30 pages, 12 backend routers, and 40+ API endpoints, built by a team of 4 in 48 hours.

---

## What Makes This Different

This is not a generic dashboard or chatbot. Five things set it apart:

First, federated intelligence. The Decision Engine doesn't just query one database — it federates eight independent data sources into a single analysis, including live federal API calls and web search.

Second, strategic scenario modeling. The What-If Estimator and Portfolio Strategy go beyond showing data — they model fiscal outcomes and recommend specific actions with projected dollar impact.

Third, full AI transparency. Every verdict shows exactly what the AI saw, how confident it is, and why. Signed impact factors, cited data sources, and an exportable decision memo. The AI recommends, humans decide.

Fourth, institutional memory. The Decision Audit Timeline means procurement knowledge doesn't walk out the door when staff leave. Every analysis builds a searchable, auditable history.

Fifth, equity by design. MBE context is embedded in the Decision Engine, not bolted on as a separate page. Spanish language support, accessibility controls, and public transparency serve the full spectrum of Richmond's population.

---

## Known Limitations

The platform has honest limitations: Groq free tier has rate limits requiring 5-second pacing between AI calls during demo. The SAM.gov Exclusions API needs Entity Management role access that wasn't available for the hackathon, so it uses the Opportunities API as a proxy. The Trade.gov Consolidated Screening List API was retired, so the system uses offline keyword matching. DuckDuckGo web search adds 3-5 seconds of latency. MBE certification status isn't available in public contract data, so the system analyzes diversity ratios as proxy indicators.

---

## Future Roadmap

If piloted by the City, the platform could scale in three phases: Near-term pilot connecting to the city's internal contract management system, expanding the PDF corpus, and adding full SAM.gov debarment checking. Medium-term scaling to other cities — swap in a different Socrata dataset ID and the platform works for any municipality with open data. Long-term transformation with predictive risk scoring, cross-jurisdiction price benchmarking, automated RFP generation, and legislative compliance tracking.

---

## Key Quotes for the Podcast

"It took me three days to get through all the contract materials. It wasn't valid."

"RVA Contract Lens turns that three-day process into eight seconds."

"The AI recommends. The human decides. Always."

"Equity isn't a separate page. It's part of every procurement decision."

"It's not just a pretty app — it's a well-engineered system: 155+ commits, 30 pages, 12 API routers, 40+ endpoints, built in 48 hours."

"The City could pilot this next quarter. Swap in a new Socrata dataset, and it works for any city in America."
