"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Table,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  ArrowRight,
} from "lucide-react";
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
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group"
      style={{ minHeight: 44 }}
    >
      <Icon
        className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors flex-1">
        {label}
      </span>
      <ArrowRight
        className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all"
        aria-hidden="true"
      />
    </Link>
  );
}

function StaffDashboardContent() {
  const { data: stats, isLoading: statsLoading } = useContractStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Staff Dashboard — Contract Risk
        </h1>
        <p className="text-base text-slate-500 mt-1">
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
          className="text-xl font-semibold text-slate-800 mb-4"
        >
          Upcoming Expirations
        </h2>
        <ExpiryTimelineChart />
      </section>

      {/* Quick Links to Sub-Pages */}
      <section aria-label="Quick navigation">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
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
