"use client";

import { useQuery } from "@tanstack/react-query";
import { DepartmentSpendingChart, VendorPieChart } from "@/components/spending-charts";
import {
  YearlySpendingChart,
  ExpiryTimelineChart,
  ProcurementTypeChart,
  ContractSizeChart,
} from "@/components/analytics-charts";
import { Disclaimer } from "@/components/disclaimer";
import { fetchAPI } from "@/lib/api";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

interface DepartmentStat {
  department: string;
  count: number;
  total_value: number;
}

interface VendorStat {
  supplier: string;
  count: number;
  total_value: number;
}

interface PublicStats {
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_60: number;
  expiring_90: number;
  departments: DepartmentStat[];
  top_vendors: VendorStat[];
}

export default function SpendingPage() {
  const { locale } = useLocale();
  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Spending Analysis
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Department spending breakdown, vendor distribution, trends over time,
          and contract size analysis.
        </p>
      </div>

      <Disclaimer locale={locale} />

      {isLoading ? (
        <div aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[400px] rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Primary charts */}
          <section aria-label={t("public.spendingBreakdown", locale)} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t("public.spendingBreakdown", locale)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DepartmentSpendingChart data={data?.departments ?? []} />
              <VendorPieChart data={data?.top_vendors ?? []} />
            </div>
          </section>

          {/* Deeper analysis */}
          <section aria-labelledby="deeper-analysis-heading" className="space-y-4">
            <h2
              id="deeper-analysis-heading"
              className="text-2xl font-bold text-slate-900 dark:text-slate-100"
            >
              {t("public.deeperAnalysis", locale)}
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Trends over time, upcoming expirations, procurement methods, and contract sizes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <YearlySpendingChart />
              <ExpiryTimelineChart />
              <ProcurementTypeChart />
              <ContractSizeChart />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
