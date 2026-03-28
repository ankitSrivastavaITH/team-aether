"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Scorecard {
  department: string;
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_90: number;
  unique_vendors: number;
  avg_contract_value: number;
  largest_contract: number;
}

interface ScorecardsResponse {
  scorecards: Scorecard[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expiryRiskClass(expiring30: number): {
  badge: string;
  text: string;
} {
  if (expiring30 > 5) {
    return {
      badge: "bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700",
      text: "text-red-700 dark:text-red-400",
    };
  }
  if (expiring30 > 0) {
    return {
      badge: "bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700",
      text: "text-amber-700 dark:text-amber-400",
    };
  }
  return {
    badge: "bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-700 dark:text-emerald-400",
  };
}

function vendorDiversityLabel(unique: number, total: number): { label: string; cls: string } {
  if (total === 0) return { label: "N/A", cls: "text-slate-400" };
  const ratio = unique / total;
  if (ratio > 0.7) return { label: "High diversity", cls: "text-emerald-600 dark:text-emerald-400" };
  if (ratio > 0.4) return { label: "Moderate", cls: "text-amber-600 dark:text-amber-400" };
  return { label: "Concentrated", cls: "text-red-600 dark:text-red-400" };
}

// ---------------------------------------------------------------------------
// ScorecardCard
// ---------------------------------------------------------------------------

function ScorecardCard({ card }: { card: Scorecard }) {
  const router = useRouter();
  const riskCls = expiryRiskClass(card.expiring_30);
  const diversity = vendorDiversityLabel(card.unique_vendors, card.total_contracts);

  function handleNavigate() {
    router.push(`/public/department/${encodeURIComponent(card.department)}`);
  }

  return (
    <article
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
      aria-label={`${card.department} department scorecard. Click to view department page.`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigate();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Building2
            className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {card.department}
          </h3>
        </div>
        <button
          onClick={handleNavigate}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded shrink-0"
          aria-label={`View public page for ${card.department}`}
        >
          View &rarr;
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total contracts */}
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Contracts</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {card.total_contracts.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total value */}
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(card.total_value ?? 0)}
            </p>
          </div>
        </div>

        {/* Unique vendors */}
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unique Vendors</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {card.unique_vendors}
            </p>
            <p className={`text-xs ${diversity.cls}`}>{diversity.label}</p>
          </div>
        </div>

        {/* Avg contract value */}
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Contract</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(card.avg_contract_value ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Expiry alert */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Expiring soon</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/staff/contracts?department=${encodeURIComponent(card.department)}&max_days=30`
                );
              }}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-opacity ${riskCls.badge} ${riskCls.text}`}
              aria-label={`${card.expiring_30} contracts expiring within 30 days for ${card.department}. Click to view.`}
            >
              {card.expiring_30} in 30d
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {card.expiring_90} in 90d
            </span>
          </div>
        </div>
      </div>

      {/* Largest contract */}
      {card.largest_contract > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Largest: {formatCurrency(card.largest_contract)}
        </p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScorecardPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<ScorecardsResponse>({
    queryKey: ["department-scorecards"],
    queryFn: () => fetchAPI<ScorecardsResponse>("/api/analytics/department-scorecards"),
    staleTime: 5 * 60 * 1000,
  });

  const scorecards = useMemo(() => {
    const all = data?.scorecards ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((s) => s.department.toLowerCase().includes(q));
  }, [data, search]);

  const totalValue = useMemo(
    () => (data?.scorecards ?? []).reduce((s, c) => s + (c.total_value ?? 0), 0),
    [data]
  );
  const totalExpiring30 = useMemo(
    () => (data?.scorecards ?? []).reduce((s, c) => s + c.expiring_30, 0),
    [data]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <LayoutGrid className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          Department Scorecards
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Per-department contract summaries with spending, vendor diversity, and expiry risk.
        </p>
      </div>

      {/* Summary chips */}
      {!isLoading && !isError && (
        <div className="flex flex-wrap gap-3 text-sm" aria-label="Portfolio summary">
          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">
            {(data?.scorecards ?? []).length} departments
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full font-medium border border-emerald-200 dark:border-emerald-800">
            {formatCurrency(totalValue)} total
          </span>
          {totalExpiring30 > 0 && (
            <span className="px-3 py-1.5 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">
              {totalExpiring30} expiring within 30 days
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <label htmlFor="dept-search" className="sr-only">
          Search departments
        </label>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          id="dept-search"
          type="search"
          placeholder="Search departments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 text-base focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-busy="true"
          aria-label="Loading department scorecards"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm"
        >
          Unable to load department scorecards. Please try again later.
        </div>
      )}

      {/* Scorecard grid */}
      {!isLoading && !isError && (
        <>
          {scorecards.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {search ? `No departments match "${search}".` : "No scorecard data available."}
              </p>
            </Card>
          ) : (
            <section aria-label={`${scorecards.length} department scorecards`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scorecards.map((card) => (
                  <ScorecardCard key={card.department} card={card} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
