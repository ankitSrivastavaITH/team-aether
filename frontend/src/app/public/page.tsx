"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, Building2, Layers, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataBadge } from "@/components/data-badge";
import { Disclaimer } from "@/components/disclaimer";
import { SpendingInsights } from "@/components/ai-insights";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

interface PublicStats {
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_60: number;
  expiring_90: number;
  departments: Array<{ department: string; count: number; total_value: number }>;
  top_vendors: Array<{ supplier: string; count: number; total_value: number }>;
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
        <p className="text-base font-medium text-slate-900 dark:text-slate-100 leading-snug">{label}</p>
        <p className={`text-4xl font-bold leading-none tracking-tight ${textClass}`}>
          {value}
        </p>
        {subtext && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 px-5 py-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group"
      style={{ minHeight: 44 }}
    >
      <Icon
        className="h-6 w-6 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1">
        <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
          {label}
        </span>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight
        className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
        aria-hidden="true"
      />
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading spending data" className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ))}
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

export default function PublicOverviewPage() {
  const { data, isLoading, isError, error } = usePublicStats();
  const { locale } = useLocale();

  const totalFormatted = data ? formatCurrency(data.total_value) : "—";
  const totalContracts = data?.total_contracts ?? 0;
  const expiring30 = data?.expiring_30 ?? 0;

  return (
    <div className="space-y-10">
      {/* Hero header */}
      <section aria-labelledby="hero-heading" className="text-center space-y-4 py-4">
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight"
        >
          {t("public.title", locale)}
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {isLoading ? (
            t("common.loading", locale)
          ) : data ? (
            <>
              {t("public.explore", locale)}{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {totalContracts.toLocaleString()}
              </strong>{" "}
              {t("public.contracts", locale)}{" "}
              <strong className="text-slate-900 dark:text-slate-100">{totalFormatted}</strong>.
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

          {/* Quick Links to Sub-Pages */}
          <section aria-label="Explore sections">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Explore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickLink
                href="/public/spending"
                label="Spending Analysis"
                description="Department spending, vendor breakdown, trends over time"
                icon={BarChart3}
              />
              <QuickLink
                href="/public/vendors"
                label="Top Vendors"
                description="Top 20 vendors by contract value"
                icon={Building2}
              />
              <QuickLink
                href="/public/sources"
                label="Multi-Source Explorer"
                description="Federal, State, and VITA contract data"
                icon={Layers}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
