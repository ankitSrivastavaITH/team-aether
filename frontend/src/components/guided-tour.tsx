"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

// ---------------------------------------------------------------------------
// Tour steps per page
// ---------------------------------------------------------------------------

const EXPLORE_BTN = '<br/><button class="tour-explore-btn" onclick="window.dispatchEvent(new Event(\'rva-tour-pause\'))">Explore on your own</button>';

const TOUR_STEPS: Record<string, DriveStep[]> = {
  "/": [
    {
      element: "main",
      popover: {
        title: "Welcome to RVA Contract Lens",
        description:
          "Richmond's $6.76B in public contracts — made visible. This 30-page platform serves procurement staff and Richmond residents. Built by a team of 4 in 36 hours.<br/><br/>Follow the guided tour, or explore on your own anytime." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff": [
    {
      popover: {
        title: "Staff Dashboard — Command Center",
        description:
          "This is what a procurement officer sees when they log in. Not a data dump — an <strong>action plan</strong>. The dashboard answers one question: <em>what needs my attention right now?</em>" + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="decide-today"]',
      popover: {
        title: "Decide Today — Critical Contracts",
        description:
          "Contracts expiring within 7 days. These need an immediate decision: renew or rebid. Each card links directly to the AI Decision Engine for a full 8-source analysis.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="plan-week"]',
      popover: {
        title: "Plan This Week — Upcoming Expirations",
        description:
          "Contracts expiring in 8-60 days. Staff has time to gather data, compare vendors, and start the rebid process if needed. Proactive instead of reactive.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="review-month"]',
      popover: {
        title: "Review This Month — Longer Horizon",
        description:
          "Contracts expiring in 60-90 days. Enough time for a full competitive procurement if needed. Early visibility prevents last-minute renewals at unfavorable terms.",
        side: "bottom",
        align: "end",
      },
    },
  ],
  "/staff/decision": [
    {
      popover: {
        title: "AI Decision Engine — The Core Feature",
        description:
          "This is where the magic happens. Select a vendor and contract. The system federates <strong>8 real data sources</strong>, runs <strong>3 federal compliance checks</strong>, and delivers a <strong>RENEW / REBID / ESCALATE</strong> verdict — all in 8 seconds." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="vendor-select"]',
      popover: {
        title: "Try It: Select a Vendor",
        description:
          'Choose any vendor — try <strong>"CIGNA HEALTHCARE"</strong> (the City\'s largest single-vendor contract). Then pick a contract and click <strong>Analyze</strong>.<br/><br/>You\'ll see: AI verdict, confidence breakdown, pros/cons with sources, equity context, alternative vendors, and an exportable decision memo.',
        side: "bottom",
        align: "start",
      },
    },
  ],
  "/staff/what-if": [
    {
      popover: {
        title: "What-If Savings Estimator — Strategic Intelligence",
        description:
          "This is what makes us more than a dashboard. Instead of just showing data, this page models the <strong>fiscal impact</strong> of procurement decisions before they happen." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="scenarios"]',
      popover: {
        title: "Three Rebid Scenarios",
        description:
          "Conservative (5%), Moderate (10%), Aggressive (15%). Toggle between them to see how projected savings change. The numbers aren't theoretical — they're calculated from <strong>real contract data and vendor concentration</strong>.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="recommendations"]',
      popover: {
        title: "AI Recommendations — What To Do Next",
        description:
          "Every recommendation has a <strong>priority level</strong>, a specific <strong>vendor to target</strong>, and an <strong>action button</strong> that links directly to the Decision Engine or Cost Analysis. This is where data becomes decisions.",
        side: "top",
        align: "center",
      },
    },
  ],
  "/staff/portfolio": [
    {
      popover: {
        title: "Portfolio Strategy Advisor",
        description:
          "This page answers: <em>what should each department do with its contract portfolio?</em> For every department, AI generates a strategy: how many contracts to renew, rebid, or escalate." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="portfolio-summary"]',
      popover: {
        title: "Portfolio-Wide Impact",
        description:
          "Total projected savings across all departments, number of high-risk departments, and contracts recommended for competitive rebid. These are the numbers a CFO or City Manager needs.",
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff/risk": [
    {
      popover: {
        title: "Vendor Concentration Risk — Monopoly Detection",
        description:
          "When a single vendor holds too much of a department's spending, the City loses negotiating power and faces supply chain risk. This page identifies those dependencies <strong>before</strong> they become crises." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hhi-explainer"]',
      popover: {
        title: "The HHI Index — Industry Standard",
        description:
          "The Herfindahl-Hirschman Index is the same metric the DOJ uses to evaluate market concentration in mergers. We apply it to city procurement: <strong>below 1,500</strong> is healthy competition, <strong>above 2,500</strong> is monopoly risk.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="concentration-cards"]',
      popover: {
        title: "Department-by-Department Analysis",
        description:
          "Each department card shows its top vendors and concentration percentage. High concentration means the City is over-dependent on one supplier — a risk to pricing, service continuity, and equity.",
        side: "top",
        align: "center",
      },
    },
  ],
  "/staff/mbe": [
    {
      popover: {
        title: "MBE & Supplier Diversity — Equity In Action",
        description:
          "The Mayor's Action Plan centers equity. This page tracks vendor diversity, small business participation, and competitive bidding rates. But equity isn't just here — it's embedded in <strong>every Decision Engine analysis</strong>." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="mbe-stats"]',
      popover: {
        title: "Diversity KPIs",
        description:
          "Small business contract count and value, unique vendor count, single-contract vendor ratio, and competitive bidding percentage. These metrics reveal whether procurement is <strong>inclusive or concentrated</strong>.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="mbe-insights"]',
      popover: {
        title: "AI-Generated Diversity Insights",
        description:
          "The system identifies patterns: which departments have low vendor diversity, where barriers to MBE participation might exist, and which procurement methods favor competition.",
        side: "top",
        align: "center",
      },
    },
  ],
  "/public": [
    {
      popover: {
        title: "Public Transparency — For Richmond Residents",
        description:
          "This view serves the second audience: taxpayers. Where does $6.76B in public money go? Residents can explore spending by department, vendor, or service — <strong>without filing a FOIA request</strong>." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="public-metrics"]',
      popover: {
        title: "At-a-Glance Spending Metrics",
        description:
          "Total contract value, number of contracts, active vendors, top department, and expiring contracts — all in plain language. Designed for residents with <strong>any level of digital literacy</strong>.",
        side: "bottom",
        align: "center",
      },
    },
    {
      popover: {
        title: "Tour Complete — Start Exploring!",
        description:
          'You\'ve seen the full platform. For the engineering behind this, visit our <a href="https://github.com/ankitSrivastavaITH/team-aether?tab=readme-ov-file#full-system-architecture" target="_blank" style="color:#a78bfa;text-decoration:underline;font-weight:600">GitHub repo</a> — it\'s not just a pretty app, it\'s a well-engineered system: <strong>172 commits</strong>, <strong>31 pages</strong>, <strong>12 API routers</strong>, <strong>46 endpoints</strong>, built in 36 hours.',
        side: "bottom",
        align: "center",
      },
    },
  ],
};

const TOUR_ROUTE_ORDER = [
  "/",
  "/staff",
  "/staff/decision",
  "/staff/what-if",
  "/staff/portfolio",
  "/staff/risk",
  "/staff/mbe",
  "/public",
];

const TOUR_KEY = "rva_tour_active";
const TOUR_STEP_KEY = "rva_tour_route_index";
const TOUR_PAUSED_KEY = "rva_tour_paused";

// ---------------------------------------------------------------------------
// Resume Banner (shown when tour is paused)
// ---------------------------------------------------------------------------

function ResumeBanner({ onResume, onEnd }: { onResume: () => void; onEnd: () => void }) {
  return (
    <div className="tour-resume-banner">
      <span>Tour paused — explore freely</span>
      <button className="tour-resume-btn" onClick={onResume}>
        Resume Tour
      </button>
      <button className="tour-end-btn" onClick={onEnd}>
        End Tour
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuidedTour component
// ---------------------------------------------------------------------------

export function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [tourActive, setTourActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const driverRef = useRef<Driver | null>(null);

  // Check if tour is in progress on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem(TOUR_KEY) === "true";
      const wasPaused = localStorage.getItem(TOUR_PAUSED_KEY) === "true";
      setTourActive(active);
      setPaused(wasPaused);
    }
  }, []);

  // Listen for tour start event
  useEffect(() => {
    function handleTourStart() {
      setPaused(false);
      localStorage.removeItem(TOUR_PAUSED_KEY);
      setTourActive(true);
    }
    window.addEventListener("rva-tour-start", handleTourStart);
    return () => window.removeEventListener("rva-tour-start", handleTourStart);
  }, []);

  // Listen for pause event (from the "Explore on your own" button in popovers)
  useEffect(() => {
    function handlePause() {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      setPaused(true);
      localStorage.setItem(TOUR_PAUSED_KEY, "true");
    }
    window.addEventListener("rva-tour-pause", handlePause);
    return () => window.removeEventListener("rva-tour-pause", handlePause);
  }, []);

  // Run tour steps for current page
  useEffect(() => {
    if (!tourActive || paused) return;

    const steps = TOUR_STEPS[pathname];
    if (!steps || steps.length === 0) return;

    const timer = setTimeout(() => {
      const currentRouteIndex = TOUR_ROUTE_ORDER.indexOf(pathname);
      const nextRoute = TOUR_ROUTE_ORDER[currentRouteIndex + 1];
      const isLastRoute = !nextRoute;

      const nextLabel = nextRoute
        ? nextRoute.split("/").filter(Boolean).pop() || "next"
        : "";

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.55)",
        stagePadding: 10,
        stageRadius: 10,
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: isLastRoute
          ? "Finish Tour"
          : `Continue to ${nextLabel} →`,
        onCloseClick: () => {
          // X button = pause, not end
          d.destroy();
          driverRef.current = null;
          setPaused(true);
          localStorage.setItem(TOUR_PAUSED_KEY, "true");
        },
        onDestroyStarted: () => {
          if (isLastRoute) {
            localStorage.removeItem(TOUR_KEY);
            localStorage.removeItem(TOUR_STEP_KEY);
            localStorage.removeItem(TOUR_PAUSED_KEY);
            setTourActive(false);
            setPaused(false);
            d.destroy();
            router.push("/staff");
          } else if (nextRoute) {
            localStorage.setItem(
              TOUR_STEP_KEY,
              String(currentRouteIndex + 1)
            );
            d.destroy();
            driverRef.current = null;
            router.push(nextRoute);
          }
        },
        steps,
      });

      driverRef.current = d;
      d.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [tourActive, paused, pathname, router]);

  const handleResume = useCallback(() => {
    setPaused(false);
    localStorage.removeItem(TOUR_PAUSED_KEY);
    // Re-trigger tour on current page
    setTourActive(false);
    setTimeout(() => setTourActive(true), 100);
  }, []);

  const handleEnd = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    localStorage.removeItem(TOUR_STEP_KEY);
    localStorage.removeItem(TOUR_PAUSED_KEY);
    setTourActive(false);
    setPaused(false);
  }, []);

  // Show resume banner when paused
  if (tourActive && paused) {
    return <ResumeBanner onResume={handleResume} onEnd={handleEnd} />;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Start Tour button
// ---------------------------------------------------------------------------

export function StartTourButton({ className }: { className?: string }) {
  const router = useRouter();

  const startTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    localStorage.setItem(TOUR_STEP_KEY, "0");
    localStorage.removeItem(TOUR_PAUSED_KEY);
    sessionStorage.setItem("welcome_seen", "true");
    // Close any open modals
    document
      .querySelectorAll("[data-base-ui-portal]")
      .forEach((el) => el.remove());
    if (window.location.pathname === "/") {
      window.dispatchEvent(new Event("rva-tour-start"));
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <button
      onClick={startTour}
      className={
        className ||
        "inline-flex items-center gap-2 px-5 min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg shadow-purple-500/20"
      }
      aria-label="Start guided tour for judges"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
      Guided Tour for Judges
    </button>
  );
}
