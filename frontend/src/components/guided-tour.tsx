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
          "Richmond's $6.76B in public contracts — made visible. This platform serves two audiences: procurement staff and Richmond residents.<br/><br/>Follow the guided tour, or explore on your own anytime." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff": [
    {
      popover: {
        title: "Staff Dashboard",
        description:
          "This is what a procurement officer sees. Not a data dump — an action plan with three urgency lanes." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="decide-today"]',
      popover: {
        title: "Decide Today",
        description:
          "Contracts expiring this week that need immediate attention. Each card links to the AI Decision Engine.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="plan-week"]',
      popover: {
        title: "Plan This Week",
        description:
          "Upcoming contracts to schedule for review. Proactive, not reactive.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="review-month"]',
      popover: {
        title: "Review This Month",
        description:
          "Longer-horizon renewals to plan for.",
        side: "bottom",
        align: "end",
      },
    },
  ],
  "/staff/decision": [
    {
      popover: {
        title: "AI Decision Engine",
        description:
          "The core feature. Select a vendor and contract — the system aggregates 8 real data sources and generates a RENEW / REBID / ESCALATE verdict in 8 seconds." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="vendor-select"]',
      popover: {
        title: "Try It: Select a Vendor",
        description:
          'Choose any vendor from the dropdown — try "CIGNA HEALTHCARE." Then select a contract and click Analyze to see the 8-source AI analysis.',
        side: "bottom",
        align: "start",
      },
    },
  ],
  "/staff/what-if": [
    {
      popover: {
        title: "What-If Savings Estimator",
        description:
          "Strategic intelligence, not just data. Model what happens if the City rebids its most concentrated contracts." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="scenarios"]',
      popover: {
        title: "Three Rebid Scenarios",
        description:
          "Conservative (5%), Moderate (10%), Aggressive (15%). Each shows specific vendors to target and projected savings.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="recommendations"]',
      popover: {
        title: "Actionable Recommendations",
        description:
          "Not just numbers — specific next steps with buttons that link directly to the relevant tool.",
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
          "Department-level strategy: how many contracts to renew, rebid, or escalate — with projected savings and equity context." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff/risk": [
    {
      popover: {
        title: "Vendor Concentration Risk",
        description:
          "HHI analysis flags departments over-dependent on single vendors. Monopoly risk identified before it becomes a crisis.",
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff/mbe": [
    {
      popover: {
        title: "Equity & Supplier Diversity",
        description:
          "Equity is woven into every decision — not a checkbox. Vendor diversity ratios, small business participation, and competitive bidding rates." + EXPLORE_BTN,
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/public": [
    {
      popover: {
        title: "Public Transparency",
        description:
          "For residents: explore $6.76B in city spending by department, vendor, or service — no FOIA request needed. Try the language toggle and accessibility controls in the sidebar.",
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
