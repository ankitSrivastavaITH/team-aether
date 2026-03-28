"use client";

import {
  ExpiryTimelineChart,
  YearlySpendingChart,
  ProcurementTypeChart,
  ContractSizeChart,
} from "@/components/analytics-charts";
import { SpendingHeatmap } from "@/components/spending-heatmap";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function AnalyticsPage() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t("analytics.title", locale)}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          {t("analytics.subtitle", locale)}
        </p>
      </div>

      {/* Charts in 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExpiryTimelineChart />
        <YearlySpendingChart />
        <ProcurementTypeChart />
        <ContractSizeChart />
      </div>

      {/* Full-width heatmap */}
      <SpendingHeatmap />
    </div>
  );
}
