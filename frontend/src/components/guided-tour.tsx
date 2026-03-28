"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// ---------------------------------------------------------------------------
// Tour steps per page — keyed by pathname
// ---------------------------------------------------------------------------

const TOUR_STEPS: Record<string, DriveStep[]> = {
  "/": [
    {
      element: "main",
      popover: {
        title: "Welcome to RVA Contract Lens",
        description:
          "Richmond's $6.76B in public contracts — made visible. This platform serves two audiences: procurement staff and Richmond residents. Let's take a 3-minute tour.",
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
          "This is what a procurement officer sees. Not a data dump — an action plan with three urgency lanes.",
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
          "Longer-horizon renewals to plan for. Let's go to the core feature — the AI Decision Engine.",
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
          "The core feature. Select a vendor and contract, and the system aggregates 8 real data sources to generate a RENEW / REBID / ESCALATE verdict in 8 seconds.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="vendor-select"]',
      popover: {
        title: "Step 1: Select a Vendor",
        description:
          'Choose any vendor — try "CIGNA HEALTHCARE" (the City\'s largest single-vendor contract). Then select a contract and click Analyze.',
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
          "This is strategic intelligence, not just data display. Model what happens if the City rebids its most concentrated contracts.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="scenarios"]',
      popover: {
        title: "Three Scenarios",
        description:
          "Conservative (5%), Moderate (10%), Aggressive (15%). Each shows specific vendors to target and projected savings per department.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="recommendations"]',
      popover: {
        title: "AI Recommendations",
        description:
          "Not just numbers — actionable next steps. Each recommendation has a button that links directly to the relevant tool. Click to take action.",
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
          "Department-level procurement strategy. For each department: how many contracts to renew, rebid, or escalate — with projected savings and equity context.",
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
          "HHI analysis identifies departments over-dependent on single vendors. Flags monopoly risk before it becomes a crisis.",
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/staff/mbe": [
    {
      popover: {
        title: "MBE & Supplier Diversity",
        description:
          "Equity is woven into every procurement decision — not a checkbox. Vendor diversity ratios, small business participation, and competitive bidding rates by department.",
        side: "bottom",
        align: "center",
      },
    },
  ],
  "/public": [
    {
      popover: {
        title: "Public Transparency View",
        description:
          "For Richmond residents. Where do your tax dollars go? Explore $6.76B in city spending by department, vendor, or service — without filing a FOIA request.",
        side: "bottom",
        align: "center",
      },
    },
  ],
};

// The route sequence for the tour
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

// ---------------------------------------------------------------------------
// Tour component
// ---------------------------------------------------------------------------

export function GuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [tourActive, setTourActive] = useState(false);

  // Check if tour is in progress on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem(TOUR_KEY) === "true";
      setTourActive(active);
    }
  }, []);

  // Listen for tour start event (from StartTourButton)
  useEffect(() => {
    function handleTourStart() {
      setTourActive(true);
    }
    window.addEventListener("rva-tour-start", handleTourStart);
    return () => window.removeEventListener("rva-tour-start", handleTourStart);
  }, []);

  // Run tour steps for current page
  useEffect(() => {
    if (!tourActive) return;

    const steps = TOUR_STEPS[pathname];
    if (!steps || steps.length === 0) return;

    // Small delay to let the page render
    const timer = setTimeout(() => {
      const currentRouteIndex = TOUR_ROUTE_ORDER.indexOf(pathname);
      const nextRoute = TOUR_ROUTE_ORDER[currentRouteIndex + 1];
      const isLastRoute = !nextRoute;

      const d = driver({
        showProgress: true,
        animate: true,
        overlayColor: "rgba(0, 0, 0, 0.6)",
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: "rva-tour-popover",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: nextRoute ? `Continue to ${nextRoute.split("/").pop() || "next"} →` : "Finish Tour",
        onDestroyStarted: () => {
          if (isLastRoute) {
            // Tour complete
            localStorage.removeItem(TOUR_KEY);
            localStorage.removeItem(TOUR_STEP_KEY);
            setTourActive(false);
          } else if (nextRoute) {
            // Navigate to next page
            localStorage.setItem(TOUR_STEP_KEY, String(currentRouteIndex + 1));
            d.destroy();
            router.push(nextRoute);
          }
        },
        steps,
      });

      d.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [tourActive, pathname, router]);

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
    sessionStorage.setItem("welcome_seen", "true");
    // Close any open modals
    document.querySelectorAll("[data-base-ui-portal]").forEach((el) => el.remove());
    if (window.location.pathname === "/") {
      // Dispatch event so GuidedTour picks it up without reload
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
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
      Guided Tour for Judges
    </button>
  );
}
