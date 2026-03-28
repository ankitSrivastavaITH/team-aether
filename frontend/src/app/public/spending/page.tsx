"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DepartmentSpendingChart, VendorPieChart } from "@/components/spending-charts";
import {
  YearlySpendingChart,
  ExpiryTimelineChart,
  ProcurementTypeChart,
  ContractSizeChart,
} from "@/components/analytics-charts";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";
import {
  TrendingUp,
  FileText,
  DollarSign,
  Lightbulb,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface SizeRow {
  bucket: string;
  sort_order: number;
  count: number;
  total_value: number;
}

interface SizeResponse {
  data: SizeRow[];
}

interface ProcurementRow {
  procurement_type: string;
  count: number;
  total_value: number;
}

interface ProcurementResponse {
  data: ProcurementRow[];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InsightCard({
  icon: Icon,
  iconBg,
  text,
}: {
  icon: React.ElementType;
  iconBg: string;
  text: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardContent className="pt-4 pb-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  id,
}: {
  title: string;
  description: string;
  id?: string;
}) {
  return (
    <div className="space-y-1">
      <h2
        id={id}
        className="text-2xl font-bold text-slate-900 dark:text-slate-100"
      >
        {title}
      </h2>
      <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SpendingPage() {
  const { locale } = useLocale();

  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch additional analytics for insights
  const { data: sizeData } = useQuery<SizeResponse>({
    queryKey: ["analytics-contract-size-distribution"],
    queryFn: () => fetchAPI<SizeResponse>("/api/analytics/contract-size-distribution"),
    staleTime: 10 * 60 * 1000,
  });

  const { data: procData } = useQuery<ProcurementResponse>({
    queryKey: ["analytics-spending-by-type"],
    queryFn: () => fetchAPI<ProcurementResponse>("/api/analytics/spending-by-type"),
    staleTime: 10 * 60 * 1000,
  });

  // Derive insight numbers
  const insights = useMemo(() => {
    if (!data) return null;

    const depts = data.departments ?? [];
    const topDept = [...depts].sort((a, b) => b.total_value - a.total_value)[0];
    const topDeptPct = topDept && data.total_value > 0
      ? Math.round((topDept.total_value / data.total_value) * 100)
      : 0;

    // Top procurement type
    const procRows = procData?.data ?? [];
    const topProc = [...procRows].sort((a, b) => b.count - a.count)[0];

    // Large contracts
    const sizeRows = sizeData?.data ?? [];
    const largeContracts = sizeRows
      .filter((r) => r.bucket.includes("10M") || r.bucket.includes("$10"))
      .reduce((sum, r) => sum + r.count, 0);

    return { topDept, topDeptPct, topProc, largeContracts };
  }, [data, sizeData, procData]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Spending Analysis
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Understand how Richmond spends public money. Explore department budgets, vendor
          concentration, procurement methods, and contract size distributions.
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
          {/* Primary charts: Department spending + Vendor distribution */}
          <section aria-label={t("public.spendingBreakdown", locale)} className="space-y-4">
            <SectionHeader
              title="Who Gets the Money?"
              description="See which departments spend the most and which vendors receive the largest contracts. Click any bar or slice to explore deeper."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DepartmentSpendingChart data={data?.departments ?? []} />
              <VendorPieChart data={data?.top_vendors ?? []} />
            </div>
          </section>

          {/* Insight cards between chart sections */}
          {insights && (
            <section aria-label="Key spending insights" className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Key Takeaways
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                What the numbers reveal about Richmond&apos;s spending patterns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.topDept && insights.topDeptPct > 0 && (
                  <InsightCard
                    icon={TrendingUp}
                    iconBg="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    text={`${insights.topDept.department} accounts for ${insights.topDeptPct}% of all spending.`}
                  />
                )}
                {insights.topProc && (
                  <InsightCard
                    icon={FileText}
                    iconBg="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                    text={`"${insights.topProc.procurement_type}" is the most common procurement method, used in ${insights.topProc.count.toLocaleString()} contracts.`}
                  />
                )}
                {insights.largeContracts > 0 && (
                  <InsightCard
                    icon={DollarSign}
                    iconBg="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                    text={`${insights.largeContracts.toLocaleString()} contracts are worth over $10M each.`}
                  />
                )}
              </div>
            </section>
          )}

          {/* Year-over-year trend */}
          <section aria-labelledby="trend-heading" className="space-y-4">
            <SectionHeader
              id="trend-heading"
              title="How Has Spending Changed Over Time?"
              description="Track year-over-year trends in total contract spending and the number of contracts awarded each year."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <YearlySpendingChart />
              <ExpiryTimelineChart />
            </div>
          </section>

          {/* Procurement types + Contract size */}
          <section aria-labelledby="deeper-analysis-heading" className="space-y-4">
            <SectionHeader
              id="deeper-analysis-heading"
              title="How Are Contracts Awarded?"
              description="Procurement methods determine how the city selects vendors. Invitation to Bid, RFP, and Cooperative agreements each serve different purposes."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProcurementTypeChart />
              <ContractSizeChart />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
