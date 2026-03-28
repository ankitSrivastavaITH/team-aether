"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Table,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency, riskColor } from "@/lib/utils";
import { Disclaimer } from "@/components/disclaimer";
import { RiskAlerts } from "@/components/risk-alerts";
import { RiskNarrative } from "@/components/ai-insights";
import { ExpiryTimelineChart } from "@/components/analytics-charts";
import { useContractStats } from "@/hooks/use-contracts";

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group"
      style={{ minHeight: 44 }}
    >
      <Icon
        className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 transition-colors flex-1">
        {label}
      </span>
      <ArrowRight
        className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
        aria-hidden="true"
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Priority Decision Queue — contracts expiring soonest that need action
// ---------------------------------------------------------------------------

interface DecisionContract {
  contract_number: string;
  supplier: string;
  value: number;
  days_to_expiry?: number;
  risk_level?: string;
  [key: string]: unknown;
}

function PriorityDecisionQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ["decision-queue"],
    queryFn: () =>
      fetchAPI<{ contracts: DecisionContract[]; total: number }>(
        "/api/contracts",
        { max_days: 60, limit: 8 },
      ),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section aria-labelledby="decision-queue-heading">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2
            id="decision-queue-heading"
            className="text-xl font-semibold text-slate-800 dark:text-slate-200"
          >
            Contracts Needing Your Decision
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Critical and warning contracts expiring soonest &mdash; click to
          analyze
        </p>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          aria-busy="true"
          aria-label="Loading decision queue"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  const contracts = data?.contracts ?? [];

  if (contracts.length === 0) {
    return (
      <section aria-labelledby="decision-queue-heading">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2
            id="decision-queue-heading"
            className="text-xl font-semibold text-slate-800 dark:text-slate-200"
          >
            Contracts Needing Your Decision
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <CheckCircle
            className="h-5 w-5 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            No contracts need immediate attention
          </span>
        </div>
      </section>
    );
  }

  // Sort by days to expiry ascending (most urgent first)
  const sorted = [...contracts].sort(
    (a, b) => (a.days_to_expiry ?? 999) - (b.days_to_expiry ?? 999),
  );

  return (
    <section aria-labelledby="decision-queue-heading">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h2
          id="decision-queue-heading"
          className="text-xl font-semibold text-slate-800 dark:text-slate-200"
        >
          Contracts Needing Your Decision
        </h2>
        {data?.total != null && (
          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
            {data.total} expiring in 60 days
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Critical and warning contracts expiring soonest &mdash; click to analyze
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((c) => {
          const risk = c.risk_level ?? "unknown";
          return (
            <Link
              key={c.contract_number}
              href="/staff/decision"
              className="group flex flex-col gap-1.5 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={`Analyze contract ${c.contract_number} from ${c.supplier}, ${formatCurrency(c.value)}, ${risk} risk`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                  {c.supplier}
                </span>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${riskColor(risk)}`}
                >
                  {risk === "critical"
                    ? "Critical"
                    : risk === "warning"
                      ? "Warning"
                      : risk.charAt(0).toUpperCase() + risk.slice(1)}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {c.contract_number}
              </span>
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(c.value)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {c.days_to_expiry != null
                    ? `${c.days_to_expiry}d left`
                    : "Expiry unknown"}
                </span>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline mt-1">
                Analyze &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StaffDashboardContent() {
  const { data: stats, isLoading: statsLoading } = useContractStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Staff Dashboard — Contract Risk
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Monitor contract expirations and procurement risk across departments.
        </p>
      </div>

      {/* Disclaimer */}
      <Disclaimer />

      {/* Risk Alert Stats */}
      {statsLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          aria-busy="true"
          aria-label="Loading risk summary"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <RiskAlerts
          totalContracts={(stats.total_contracts as number) ?? 0}
          totalValue={(stats.total_value as number) ?? 0}
          expiring30={(stats.expiring_30 as number) ?? (stats.expiring_soon as number) ?? 0}
          expiring60={(stats.expiring_60 as number) ?? 0}
          expiring90={(stats.expiring_90 as number) ?? 0}
        />
      ) : null}

      {/* AI Risk Narrative */}
      <RiskNarrative />

      {/* Expiry Timeline */}
      <section aria-labelledby="expiry-timeline-heading">
        <h2
          id="expiry-timeline-heading"
          className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4"
        >
          Upcoming Expirations
        </h2>
        <ExpiryTimelineChart />
      </section>

      {/* Priority Decision Queue */}
      <PriorityDecisionQueue />

      {/* Quick Links to Sub-Pages */}
      <section aria-label="Quick navigation">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink
            href="/staff/contracts"
            label="View all contracts"
            icon={Table}
          />
          <QuickLink
            href="/staff/ask"
            label="Ask Richmond"
            icon={MessageSquare}
          />
          <QuickLink
            href="/staff/risk"
            label="Vendor risk analysis"
            icon={ShieldAlert}
          />
          <QuickLink
            href="/staff/analytics"
            label="Spending analytics"
            icon={BarChart3}
          />
        </div>
      </section>
    </div>
  );
}

export default function StaffDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-10 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <StaffDashboardContent />
    </Suspense>
  );
}
