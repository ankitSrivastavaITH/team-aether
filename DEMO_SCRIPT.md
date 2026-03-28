# RVA Contract Lens — 3-Minute Demo Script

**Video link:** [to be uploaded]
**Try it out:** https://hackrva.ithena.app
**GitHub:** https://github.com/ankitSrivastavaITH/team-aether

---

## Rubric Alignment

| Time | Section | Rubric Category | Weight (Mayor's Choice) |
|---|---|---|---|
| 0:00-0:25 | The Problem | Impact (5x) | Judges see: real civic problem, MAP alignment |
| 0:25-1:10 | Decision Engine Demo | Execution (3x), User Value (4x) | Judges see: working prototype, specific user, pain point solved |
| 1:10-1:40 | Strategic Intelligence | Innovation (1x), Feasibility (5x) | Judges see: not a generic dashboard — strategic framework |
| 1:40-2:10 | Public Transparency | Impact (5x), User Value (4x) | Judges see: dual-user value (staff + residents) |
| 2:10-2:35 | Equity & Accessibility | Equity (3x) | Judges see: who gets left out was considered |
| 2:35-3:00 | Close & Pilot Path | Feasibility (5x) | Judges see: could be piloted tomorrow |

---

## Script

### [0:00-0:25] THE PROBLEM — Impact

**SHOW:** Landing page (screenshot 01)

**SAY:**
> "Richmond manages $6.1 billion in public contracts across 37 departments. Today, reviewing a single contract for renewal means manually searching three databases, reading hundreds of pages of PDFs, and checking federal compliance lists one by one."
>
> "The Deputy Director of IT Strategy told us it took him three days to verify that one purchase from the year before was still valid. It wasn't. The contract term had changed, and the City almost lost the ability to defend its technology infrastructure."
>
> "RVA Contract Lens turns that three-day process into eight seconds."

**CLICK:** Staff Dashboard button

---

### [0:25-0:45] STAFF DASHBOARD — User Value

**SHOW:** Staff Dashboard (screenshot 02)

**SAY:**
> "This is what a procurement officer sees when they log in. Not a data dump — an action plan."
>
> "Three lanes: Decide Today — contracts that expire this week. Plan This Week — contracts coming due. Review This Month — upcoming renewals to schedule."
>
> "Every card links directly to the Decision Engine. Let me show you the core feature."

**CLICK:** Decision Engine in sidebar

---

### [0:45-1:10] AI DECISION ENGINE — Execution + User Value

**SHOW:** Decision Engine running analysis (screenshot 03)

**SAY:**
> "I select a vendor — let's use CIGNA Healthcare, the City's largest single-vendor contract in Human Resources."
>
> "The system aggregates eight real data sources: contract details, vendor history, live SAM.gov compliance, FCC prohibited manufacturers, consolidated screening lists, vendor concentration risk, PDF contract terms from OCR, and public web intelligence."
>
> "In eight seconds, it returns a verdict — RENEW, REBID, or ESCALATE — with a confidence score. But here's what makes this different from a chatbot:"
>
> "Full AI transparency. You can see exactly what the AI analyzed. The confidence breakdown shows signed impact factors: +20 for compliance clear, -15 for price increasing. Reasons to renew, reasons to rebid, each with the data source cited."
>
> "The AI recommends. The human decides. Every decision is saved to an audit trail."

---

### [1:10-1:40] STRATEGIC INTELLIGENCE — Innovation + Feasibility

**SHOW:** What-If Savings Estimator (screenshot 05)

**SAY:**
> "This isn't just a dashboard. Let me show you strategic procurement intelligence."
>
> "The What-If Savings Estimator models what happens if the City rebids its most concentrated contracts. Three scenarios: conservative at 5%, moderate at 10%, aggressive at 15%. Each shows specific vendors to target, projected savings per department, and the next step — with a button that takes you directly to the Decision Engine for that vendor."

**SHOW:** Portfolio Strategy Advisor (screenshot 06)

> "Portfolio Strategy goes deeper. For every department, the system generates a recommendation: how many contracts to renew, how many to rebid, how many need immediate escalation. Public Utilities has 204 expired contracts — the system flags that and tells you exactly what to do about it."
>
> "This is institutional memory. When a procurement officer leaves, the next person inherits data-driven context, not a blank slate."

**SHOW:** Decision Audit Timeline (screenshot 07)

---

### [1:40-2:10] PUBLIC TRANSPARENCY — Impact (dual user)

**SHOW:** Public Overview (screenshot 12)

**SAY:**
> "RVA Contract Lens serves two audiences. For residents, there's a public transparency view."
>
> "Where do your tax dollars go? Residents can explore $6.1 billion in city spending by department, by vendor, or by service — without filing a FOIA request."

**SHOW:** Public Spending (screenshot 13)

> "Interactive spending breakdowns by department. Click any vendor to see their full contract history. Click any department to see their portfolio."
>
> "This directly supports the Mayor's Action Plan goal of making fiscal responsibility visible to the public."

---

### [2:10-2:35] EQUITY & ACCESSIBILITY — Equity

**SAY:**
> "We designed this to work for everyone, not just the easiest users."

**SHOW:** Toggle Spanish language (demonstrate on live site)

> "Full bilingual support — English and Spanish — across all staff pages. Atkinson Hyperlegible font, designed for low-vision users. Font size toggle, high-contrast mode, skip links on every page."

**SHOW:** MBE Analysis (screenshot 09)

> "Equity is woven into the Decision Engine itself. When you analyze a contract, you see the department's vendor diversity score and a specific equity note — whether to seek MBE vendors, whether competition is healthy."
>
> "Equity isn't a separate page. It's part of every procurement decision."

---

### [2:35-3:00] CLOSE — Feasibility + Impact

**SHOW:** Landing page or Dashboard

**SAY:**
> "Everything you've seen runs on real City of Richmond data — 1,365 contracts, $6.1 billion, from the City's own open data portal. No synthetic data. No internal system access required."
>
> "The entire platform — staff view, public transparency, AI decision engine, strategic intelligence — was built by one person in 48 hours."
>
> "The City could pilot this in the next quarter. Swap in a new Socrata dataset, and it works for any city in America."
>
> "RVA Contract Lens. From three days to eight seconds. Real data. Real decisions. Real transparency."

---

## "Try It Out" Guide for Judges (3 minutes)

When judges visit https://hackrva.ithena.app during discussion, here's what they should try:

### Minute 1: Decision Engine (the hero feature)
1. Click **Staff Dashboard**
2. Click **Decision Engine** in sidebar
3. Select any vendor from dropdown (try "CIGNA HEALTHCARE")
4. Select a contract and click **Analyze**
5. Watch the 8-source analysis run
6. Scroll through: verdict, confidence breakdown, evidence grid, equity context, alternative vendors, decision memo

### Minute 2: Strategic Intelligence
1. Click **What-If Savings** in sidebar
2. Toggle between Conservative/Moderate/Aggressive scenarios
3. Read the AI Recommendations — click any action button
4. Click **Portfolio Strategy** — expand a department, read the action items
5. Click **Decision Audit** — see institutional memory

### Minute 3: Public View + Equity
1. Click **Public View** (top-right)
2. Explore spending by department, click a vendor
3. Click the language toggle (bottom of sidebar) to switch to Spanish
4. Click font size toggle (A+) and high-contrast mode
5. Return to Staff Dashboard — notice bilingual headers

---

## Key Phrases for Q&A

If judges ask about...

**"Is this just a dashboard?"**
> "No — it's a federated intelligence engine. Eight independent data sources, three live compliance checks, and strategic scenario modeling. The What-If Estimator and Portfolio Strategy go beyond displaying data — they recommend specific actions with projected fiscal impact."

**"Could this actually be piloted?"**
> "Yes, today. It runs on the City's existing open data. No internal system access required. The only setup is a free Groq API key. We built it in 48 hours with one person — a pilot team could have it running in a week."

**"What about legal compliance?"**
> "The AI recommends, humans decide. Every verdict shows full transparency — what the AI saw, how confident it is, and why. Staff can verify every data point before acting. All decisions are saved to an audit trail."

**"What about equity?"**
> "Equity is embedded, not bolted on. The Decision Engine shows vendor diversity scores and MBE context in every analysis. Spanish language support across all pages. Atkinson Hyperlegible font for low-vision users. Font size and contrast controls for both staff and residents."

**"How is this innovative?"**
> "No city has an 8-source federated procurement intelligence engine. Most tools show data. This one tells you what to do about it — with specific vendor targets, projected savings, and action buttons that take you directly to the analysis. Plus it builds institutional memory through the audit timeline."

---

## Screenshots Reference

| # | File | Page | Demo Section |
|---|---|---|---|
| 01 | 01-landing.png | Landing page | Opening |
| 02 | 02-dashboard.png | Staff Dashboard | Staff View |
| 03 | 03-decision-engine.png | Decision Engine | Core Feature |
| 04 | 04-health-scanner.png | Health Scanner | Portfolio Intelligence |
| 05 | 05-what-if.png | What-If Savings | Strategic Intelligence |
| 06 | 06-portfolio.png | Portfolio Strategy | Strategic Intelligence |
| 07 | 07-audit.png | Decision Audit | Institutional Memory |
| 08 | 08-risk.png | Vendor Risk (HHI) | Risk Analysis |
| 09 | 09-mbe.png | MBE Analysis | Equity |
| 10 | 10-pdf-analyzer.png | PDF Analyzer | OCR Demo |
| 11 | 11-ask-richmond.png | Ask Richmond | NL Query |
| 12 | 12-public-overview.png | Public Overview | Transparency |
| 13 | 13-public-spending.png | Public Spending | Transparency |
| 14 | 14-anomalies.png | Anomalies | Risk Analysis |
| 15 | 15-contracts.png | All Contracts | Data Table |
