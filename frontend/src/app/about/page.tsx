import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "About — RVA Contract Lens",
  description:
    "Learn how RVA Contract Lens makes Richmond's public procurement transparent for staff and residents alike. Data sources, technology, and accessibility commitments.",
};

const dataSources = [
  {
    name: "City of Richmond Open Data (Socrata)",
    url: "https://data.richmondgov.com",
    coverage: "City contracts — active, expiring, expired",
    refresh: "Weekly",
  },
  {
    name: "SAM.gov / USASpending.gov",
    url: "https://sam.gov",
    coverage: "Federal contracts and exclusion (debarment) data",
    refresh: "Daily via API",
  },
  {
    name: "eVA — Virginia's eProcurement Portal",
    url: "https://eva.virginia.gov",
    coverage: "Virginia state contracts and vendor data",
    refresh: "On ingest",
  },
  {
    name: "VITA — Virginia IT Agency",
    url: "https://vita.virginia.gov",
    coverage: "Statewide IT contracts and technology agreements",
    refresh: "On ingest",
  },
];

const techStack = [
  { layer: "Frontend", tech: "Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui" },
  { layer: "Backend", tech: "FastAPI (Python), DuckDB for in-process analytics" },
  { layer: "AI Features", tech: "Anthropic Claude — natural language queries, risk narrative, PDF extraction" },
  { layer: "Data", tech: "City Socrata API, SAM.gov API, eVA, VITA — unified into a single DuckDB instance" },
  { layer: "Hosting", tech: "Vercel (frontend), Railway (backend)" },
];

export default function AboutPage() {
  return (
    <>
      <header role="banner">
        <NavBar />
      </header>
      <main
        id="main-content"
        role="main"
        className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-slate-800 dark:text-slate-200"
      >
        {/* Page title */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
            About
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            RVA Contract Lens
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Richmond&apos;s procurement contracts represent billions of dollars of taxpayer money
            — but until now, understanding them required navigating multiple government portals,
            downloading spreadsheets, and manually cross-referencing federal compliance lists.
            RVA Contract Lens changes that.
          </p>
        </div>

        {/* What it does */}
        <section aria-labelledby="what-it-does" className="mb-12">
          <h2
            id="what-it-does"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4"
          >
            What It Does
          </h2>
          <div className="space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              RVA Contract Lens aggregates contract data from four sources — the City of
              Richmond, SAM.gov, Virginia eVA, and VITA — into a single searchable, filterable
              dashboard. Procurement staff can ask plain-English questions like &ldquo;which
              contracts expire in the next 30 days?&rdquo; and receive AI-generated risk
              recommendations, supplier concentration analysis, and automated compliance checks
              against federal exclusion lists.
            </p>
            <p>
              For Richmond residents and journalists, the public transparency view makes it easy
              to see how the city spends money by department, vendor, and category — without
              needing any technical background. All data shown is sourced from public government
              datasets and is presented exactly as published. Nothing is modified or inferred
              without a clear disclosure.
            </p>
          </div>
        </section>

        {/* Who it's for */}
        <section aria-labelledby="who-its-for" className="mb-12">
          <h2
            id="who-its-for"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4"
          >
            Who It&apos;s For
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-5">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Procurement Staff
              </h3>
              <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-200 list-disc list-inside">
                <li>Track expiring contracts before they lapse</li>
                <li>Check vendors against all 7 required federal exclusion lists</li>
                <li>Identify vendor concentration risk by department</li>
                <li>AI-generated renewal recommendations and risk narratives</li>
                <li>Extract key terms and dates from PDF solicitations</li>
              </ul>
            </div>
            <div className="rounded-xl border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 p-5">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                Richmond Residents
              </h3>
              <ul className="space-y-2 text-sm text-orange-900 dark:text-orange-200 list-disc list-inside">
                <li>See how City money is spent by department and vendor</li>
                <li>Search contracts by keyword or supplier name</li>
                <li>Find city services and the contracts that support them</li>
                <li>Accessible design — WCAG AA, screen reader compatible</li>
                <li>Spanish language support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data sources table */}
        <section aria-labelledby="data-sources" className="mb-12">
          <h2
            id="data-sources"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4"
          >
            Data Sources
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Coverage
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    Refresh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dataSources.map((source) => (
                  <tr
                    key={source.name}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        {source.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {source.coverage}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-500">
                      {source.refresh}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            All data is sourced from public government APIs and datasets. RVA Contract Lens is not
            an official City of Richmond product.
          </p>
        </section>

        {/* Technology stack */}
        <section aria-labelledby="technology" className="mb-12">
          <h2
            id="technology"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4"
          >
            Technology
          </h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {techStack.map((item, i) => (
              <div
                key={item.layer}
                className={`flex flex-col sm:flex-row gap-1 sm:gap-4 px-4 py-3 text-sm ${
                  i % 2 === 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50 dark:bg-slate-800/50"
                } ${i < techStack.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300 sm:w-28 flex-shrink-0">
                  {item.layer}
                </span>
                <span className="text-slate-600 dark:text-slate-400">{item.tech}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility commitment */}
        <section aria-labelledby="accessibility" className="mb-12">
          <h2
            id="accessibility"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3"
          >
            Accessibility Commitment
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            RVA Contract Lens is built to meet{" "}
            <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.1 Level AA standards.
            All interactive elements have visible focus indicators, color contrast ratios meet or
            exceed 4.5:1, and the interface is fully navigable by keyboard. Screen reader support
            is provided through semantic HTML and ARIA labels throughout. Spanish language support
            is available via the language toggle in the navigation bar.
          </p>
        </section>

        {/* Built for hackathon + GitHub */}
        <section
          aria-label="Hackathon and open source information"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-6 text-white"
        >
          <p className="font-semibold text-lg mb-1">Built for Hack for RVA 2026</p>
          <p className="text-blue-100 text-sm leading-relaxed mb-4">
            This project was created during Hack for RVA 2026, Track 1: A Thriving City Hall.
            It is open source and welcomes contributions from the Richmond civic tech community.
          </p>
          <a
            href="https://github.com/hackrva/rva-contract-lens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
          >
            View on GitHub
          </a>
        </section>
      </main>
    </>
  );
}
