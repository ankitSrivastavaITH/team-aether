"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataBadge } from "@/components/data-badge";
import { Disclaimer } from "@/components/disclaimer";
import { DepartmentSpendingChart, VendorPieChart } from "@/components/spending-charts";
import { VendorCard } from "@/components/vendor-card";
import { SpendingInsights } from "@/components/ai-insights";
import {
  YearlySpendingChart,
  ExpiryTimelineChart,
  ProcurementTypeChart,
  ContractSizeChart,
} from "@/components/analytics-charts";
import { MultiSourceExplorer } from "@/components/multi-source-explorer";
import { StateContracts } from "@/components/state-contracts";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
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

function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });
}

function StatCard({
  label,
  value,
  icon,
  bgClass,
  textClass,
  subtext,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  bgClass: string;
  textClass: string;
  subtext?: string;
}) {
  return (
    <Card className={`${bgClass} border-0 shadow-sm`}>
      <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-2">
        {icon && (
          <div className={`${textClass} mb-1`} aria-hidden="true">
            {icon}
          </div>
        )}
        <p className="text-base font-medium text-[#1E293B] leading-snug">{label}</p>
        <p className={`text-4xl font-bold leading-none tracking-tight ${textClass}`}>
          {value}
        </p>
        {subtext && (
          <p className="text-sm text-[#475569] mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading spending data" className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-36 rounded-xl bg-[#E2E8F0] animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[400px] rounded-xl bg-[#E2E8F0] animate-pulse" />
        <div className="h-[400px] rounded-xl bg-[#E2E8F0] animate-pulse" />
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800"
    >
      <p className="font-semibold text-lg mb-2">Unable to load spending data</p>
      <p className="text-base">{message}</p>
      <p className="text-sm mt-3 text-red-600">
        Please try refreshing the page. If the problem continues, the data service may be temporarily unavailable.
      </p>
    </div>
  );
}

export default function PublicTransparencyPage() {
  const { data, isLoading, isError, error } = usePublicStats();
  const { locale } = useLocale();

  const totalFormatted = data ? formatCurrency(data.total_value) : "—";
  const totalContracts = data?.total_contracts ?? 0;
  const expiring30 = data?.expiring_30 ?? 0;

  // Top 20 vendors for vendor grid
  const topVendors = data?.top_vendors
    ? [...data.top_vendors]
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 20)
    : [];

  return (
    <div className="space-y-10">
      {/* Hero header */}
      <section aria-labelledby="hero-heading" className="text-center space-y-4 py-4">
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] leading-tight"
        >
          {t("public.title", locale)}
        </h1>
        <p className="text-lg sm:text-xl text-[#475569] max-w-2xl mx-auto leading-relaxed">
          {isLoading ? (
            t("common.loading", locale)
          ) : data ? (
            <>
              {t("public.explore", locale)}{" "}
              <strong className="text-[#1E293B]">
                {totalContracts.toLocaleString()}
              </strong>{" "}
              {t("public.contracts", locale)}{" "}
              <strong className="text-[#1E293B]">{totalFormatted}</strong>.
            </>
          ) : (
            t("public.explore", locale) + " City of Richmond contracts."
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <DataBadge source={t("common.source", locale)} />
        </div>
      </section>

      {/* Disclaimer */}
      <Disclaimer locale={locale} />

      {/* Main content */}
      {isLoading && <LoadingSkeleton />}

      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      )}

      {data && (
        <>
          {/* Hero stat cards */}
          <section aria-label="Key spending figures">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label={t("public.totalValue", locale)}
                value={formatCurrency(data.total_value)}
                bgClass="bg-blue-50"
                textClass="text-[#2563EB]"
                subtext={t("public.totalValueDesc", locale)}
              />
              <StatCard
                label={t("public.activeContracts", locale)}
                value={totalContracts.toLocaleString()}
                bgClass="bg-purple-50"
                textClass="text-[#7c3aed]"
                subtext={t("public.activeDesc", locale)}
              />
              <StatCard
                label={t("public.expiring30", locale)}
                value={expiring30.toLocaleString()}
                bgClass="bg-red-50"
                textClass="text-[#dc2626]"
                icon={<AlertCircle className="h-6 w-6" />}
                subtext={t("public.expiringDesc", locale)}
              />
            </div>
          </section>

          {/* AI Spending Insights */}
          <SpendingInsights />

          {/* Charts */}
          <section aria-label={t("public.spendingBreakdown", locale)} className="space-y-4">
            <h2 className="sr-only">{t("public.spendingBreakdown", locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DepartmentSpendingChart data={data.departments ?? []} />
              <VendorPieChart data={data.top_vendors ?? []} />
            </div>
          </section>

          {/* Deeper Analysis */}
          <section aria-labelledby="deeper-analysis-heading" className="space-y-4">
            <h2
              id="deeper-analysis-heading"
              className="text-2xl font-bold text-[#1E293B]"
            >
              {t("public.deeperAnalysis", locale)}
            </h2>
            <p className="text-base text-[#475569]">
              Trends over time, upcoming expirations, procurement methods, and contract sizes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <YearlySpendingChart />
              <ExpiryTimelineChart />
              <ProcurementTypeChart />
              <ContractSizeChart />
            </div>
          </section>

          {/* Federal Contracts Multi-Source Explorer */}
          <section aria-labelledby="federal-contracts-heading" className="space-y-4">
            <h2
              id="federal-contracts-heading"
              className="text-2xl font-bold text-[#1E293B]"
            >
              Multi-Source Contract Explorer
            </h2>
            <p className="text-base text-[#475569]">
              Beyond City contracts, federal and state agencies award billions to Richmond-area vendors.
              Explore contracts across City, State (eVA), and federal sources side-by-side.
            </p>
            <MultiSourceExplorer />
          </section>

          {/* Virginia State Contracts */}
          <StateContracts />

          {/* Top vendors grid */}
          <section aria-labelledby="vendors-heading" className="space-y-4">
            <h2
              id="vendors-heading"
              className="text-2xl font-bold text-[#1E293B]"
            >
              {t("public.top20", locale)}
            </h2>
            <p className="text-base text-[#475569]">
              {t("public.top20Desc", locale)}
            </p>
            {topVendors.length > 0 ? (
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0"
                aria-label={t("public.topVendors", locale)}
              >
                {topVendors.map((vendor) => (
                  <li key={vendor.supplier}>
                    <VendorCard
                      name={vendor.supplier}
                      contractCount={vendor.count}
                      totalValue={vendor.total_value}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#475569] text-base">No vendor data available.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
