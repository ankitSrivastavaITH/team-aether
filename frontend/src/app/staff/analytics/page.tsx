"use client";

import {
  ExpiryTimelineChart,
  YearlySpendingChart,
  ProcurementTypeChart,
  ContractSizeChart,
} from "@/components/analytics-charts";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-base text-slate-500 mt-1">
          Spending trends, upcoming expirations, procurement methods, and
          contract size distribution.
        </p>
      </div>

      {/* Charts in 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpiryTimelineChart />
        <YearlySpendingChart />
        <ProcurementTypeChart />
        <ContractSizeChart />
      </div>
    </div>
  );
}
