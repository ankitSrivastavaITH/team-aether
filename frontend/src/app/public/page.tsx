"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Layers,
  ArrowRight,
  DollarSign,
  FileText,
  Users,
  Clock,
  TrendingUp,
  Lightbulb,
  Compass,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataBadge } from "@/components/data-badge";
import { Disclaimer } from "@/components/disclaimer";
import { SpendingInsights } from "@/components/ai-insights";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicStats {
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_60: number;
  expiring_90: number;
  departments: Array<{ department: string; count: number; total_value: number }>;
  top_vendors: Array<{ supplier: string; count: number; total_value: number }>;
}

interface ExpiringContract {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  days_to_expiry: number;
  end_date: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function usePublicStats() {
  return useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });
}

function useExpiringContracts() {
  return useQuery<ExpiringContract[]>({
    queryKey: ["expiring-soon"],
    queryFn: () => fetchAPI<ExpiringContract[]>("/api/contracts", { limit: "3", max_days: "7" }),
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// StatCard and AtAGlanceChip removed — replaced by inline metric cards

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
      className="flex items-start gap-4 px-5 py-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group"
      style={{ minHeight: 44 }}
    >
      <Icon
        className="h-6 w-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <ArrowRight
        className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
        aria-hidden="true"
      />
    </Link>
  );
}

function TrendingItem({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor,
  href,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  iconColor: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all">
      <div className={`p-2 rounded-lg ${iconColor} flex-shrink-0`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg" style={{ minHeight: 44 }}>
        {content}
      </Link>
    );
  }
  return content;
}

// QuickFactCard removed — consolidated into "Did You Know?" section

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading spending data" className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-40 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ))}
      </div>
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
      className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center text-red-800 dark:text-red-300"
    >
      <p className="font-semibold text-lg mb-2">Unable to load spending data</p>
      <p className="text-base">{message}</p>
      <p className="text-sm mt-3 text-red-600 dark:text-red-400">
        Please try refreshing the page. If the problem continues, the data service may be temporarily unavailable.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PublicOverviewPage() {
  const { data, isLoading, isError, error } = usePublicStats();
  const { data: expiringData } = useExpiringContracts();
  const { locale } = useLocale();

  const totalFormatted = data ? formatCurrency(data.total_value) : "--";
  const totalContracts = data?.total_contracts ?? 0;
  const expiring30 = data?.expiring_30 ?? 0;

  // Derived insights computed from the stats data
  const derived = useMemo(() => {
    if (!data) return null;

    const depts = data.departments ?? [];
    const vendors = data.top_vendors ?? [];

    const uniqueDepts = depts.length;
    const uniqueVendors = vendors.length;

    // Top spending department
    const topDept = [...depts].sort((a, b) => b.total_value - a.total_value)[0];
    // Largest vendor
    const topVendor = [...vendors].sort((a, b) => b.total_value - a.total_value)[0];
    // Most contracts by dept
    const mostContractsDept = [...depts].sort((a, b) => b.count - a.count)[0];
    // Average contract value
    const avgValue = totalContracts > 0 ? data.total_value / totalContracts : 0;
    // Top 5 vendor concentration
    const top5Value = [...vendors]
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5)
      .reduce((sum, v) => sum + v.total_value, 0);
    const top5Pct = data.total_value > 0 ? Math.round((top5Value / data.total_value) * 100) : 0;
    // Does top dept have more contracts than all others combined?
    const topDeptCount = mostContractsDept?.count ?? 0;
    const otherDeptCount = depts.reduce((sum, d) => sum + d.count, 0) - topDeptCount;
    const topDeptDominates = topDeptCount > otherDeptCount;

    return {
      uniqueDepts,
      uniqueVendors,
      topDept,
      topVendor,
      mostContractsDept,
      avgValue,
      top5Pct,
      topDeptDominates,
    };
  }, [data, totalContracts]);

  // Find contracts expiring soonest for the trending section
  const expiringSoon = useMemo(() => {
    if (!expiringData) return [];
    const contracts = Array.isArray(expiringData) ? expiringData : [];
    return contracts.slice(0, 3);
  }, [expiringData]);

  return (
    <div className="space-y-8">
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

      {data && derived && (
        <>
          {/* Key metrics — single row, no duplication */}
          <section aria-label="Key metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Value</span>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(data.total_value)}</p>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Contracts</span>
              </div>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{totalContracts.toLocaleString()}</p>
            </Card>
            <Card className={`${expiring30 > 0 ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={`h-4 w-4 ${expiring30 > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`} aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Expiring 30d</span>
              </div>
              <p className={`text-xl font-bold ${expiring30 > 0 ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>{expiring30}</p>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Departments</span>
              </div>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{derived.uniqueDepts}</p>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Vendors</span>
              </div>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{derived.uniqueVendors}</p>
            </Card>
          </section>

          {/* Trending section: What's happening now */}
          <section aria-labelledby="trending-heading">
            <h2 id="trending-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              What&apos;s Happening Now
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Contracts expiring soon and the biggest spending activity this period.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Expiring soonest */}
              {expiringSoon.length > 0 ? (
                expiringSoon.map((c, i) => (
                  <TrendingItem
                    key={i}
                    label={`Expires in ${c.days_to_expiry} day${c.days_to_expiry === 1 ? "" : "s"}`}
                    value={c.supplier}
                    subtext={`${formatCurrency(c.value)} - ${c.department}`}
                    icon={Clock}
                    iconColor="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    href={`/public/vendor/${encodeURIComponent(c.supplier)}`}
                  />
                ))
              ) : (
                <>
                  {/* Fallback: show top spending dept and largest vendor */}
                  {derived.topDept && (
                    <TrendingItem
                      label="Top Spending Department"
                      value={derived.topDept.department}
                      subtext={formatCurrency(derived.topDept.total_value)}
                      icon={TrendingUp}
                      iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      href={`/public/department/${encodeURIComponent(derived.topDept.department)}`}
                    />
                  )}
                </>
              )}
              {/* Always show top dept and largest contract if we have room */}
              {expiringSoon.length < 3 && derived.topDept && (
                <TrendingItem
                  label="Top Spending Department"
                  value={derived.topDept.department}
                  subtext={`${formatCurrency(derived.topDept.total_value)} across ${derived.topDept.count} contracts`}
                  icon={TrendingUp}
                  iconColor="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                  href={`/public/department/${encodeURIComponent(derived.topDept.department)}`}
                />
              )}
              {expiringSoon.length < 2 && derived.topVendor && (
                <TrendingItem
                  label="Largest Vendor"
                  value={derived.topVendor.supplier}
                  subtext={formatCurrency(derived.topVendor.total_value)}
                  icon={Building2}
                  iconColor="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                  href={`/public/vendor/${encodeURIComponent(derived.topVendor.supplier)}`}
                />
              )}
            </div>
          </section>

          {/* AI Spending Insights */}
          <SpendingInsights />

          {/* Did you know? */}
          <section aria-labelledby="didyouknow-heading">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
              <h2 id="didyouknow-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Did You Know?
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Interesting patterns from Richmond&apos;s contract data.
            </p>
            <div className="space-y-3">
              {derived.top5Pct > 0 && (
                <Card className="bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>{derived.top5Pct}%</strong> of all contract value goes to just 5 vendors.
                      That means a handful of companies hold the majority of city spending.
                    </p>
                  </CardContent>
                </Card>
              )}
              {derived.topDeptDominates && derived.mostContractsDept && (
                <Card className="bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong>{derived.mostContractsDept.department}</strong> manages more contracts than all other departments combined.
                    </p>
                  </CardContent>
                </Card>
              )}
              {derived.uniqueVendors > 0 && derived.uniqueDepts > 0 && (
                <Card className="bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      The city works with <strong>{derived.uniqueVendors.toLocaleString()}</strong> unique vendors
                      across <strong>{derived.uniqueDepts}</strong> departments to deliver public services.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Quick Links to Sub-Pages */}
          <section aria-label="Explore sections">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Explore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickLink
                href="/public/spending"
                label="Spending Analysis"
                description="Department spending, vendor breakdown, trends over time"
                icon={BarChart3}
              />
              <QuickLink
                href="/public/vendors"
                label="Top Vendors"
                description="Search and sort vendors by contract value"
                icon={Building2}
              />
              <QuickLink
                href="/public/sources"
                label="Multi-Source Explorer"
                description="Federal, State, and VITA contract data"
                icon={Layers}
              />
              <QuickLink
                href="/public/services"
                label="Service Navigator"
                description="Find the right city service for your issue"
                icon={Compass}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
