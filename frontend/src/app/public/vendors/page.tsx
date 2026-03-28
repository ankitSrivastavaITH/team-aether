"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/disclaimer";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";
import {
  Search,
  ArrowUpDown,
  Building2,
  DollarSign,
  FileText,
  Users,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  departments: Array<{ department: string; count: number; total_value: number }>;
  top_vendors: VendorStat[];
}

type SortField = "value" | "count" | "name";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EnhancedVendorCard({
  vendor,
  rank,
  totalSpending,
}: {
  vendor: VendorStat;
  rank: number;
  totalSpending: number;
}) {
  const encodedName = encodeURIComponent(vendor.supplier);
  const pct = totalSpending > 0 ? ((vendor.total_value / totalSpending) * 100).toFixed(1) : "0";

  return (
    <Link
      href={`/public/vendor/${encodedName}`}
      className="group block rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 transition-all duration-150 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-[3px] focus:ring-blue-600 dark:focus:ring-blue-400 focus:ring-offset-2"
      style={{ minHeight: 44 }}
      aria-label={`View contracts for ${vendor.supplier}: ${vendor.count} contracts worth ${formatCurrency(vendor.total_value)}`}
    >
      {/* Rank badge */}
      <div className="flex items-start justify-between mb-3">
        <Badge
          variant="outline"
          className="text-xs px-2 py-0.5 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
        >
          #{rank}
        </Badge>
        <span className="text-xs text-slate-400 dark:text-slate-500">{pct}% of total</span>
      </div>

      {/* Vendor name */}
      <p
        className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-3 line-clamp-2"
        aria-hidden="true"
      >
        {vendor.supplier}
      </p>

      {/* Stats */}
      <div className="space-y-2" aria-hidden="true">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
          <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
            {formatCurrency(vendor.total_value)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{vendor.count}</span>{" "}
            {vendor.count === 1 ? "contract" : "contracts"}
          </span>
        </div>
      </div>

      {/* Spending bar */}
      <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
          style={{ width: `${Math.min(Number(pct), 100)}%` }}
        />
      </div>
    </Link>
  );
}

function SortButton({
  label,
  field,
  activeField,
  onClick,
}: {
  label: string;
  field: SortField;
  activeField: SortField;
  onClick: (field: SortField) => void;
}) {
  const isActive = field === activeField;
  return (
    <button
      onClick={() => onClick(field)}
      className={`px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isActive
          ? "bg-blue-600 text-white dark:bg-blue-500"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
      }`}
      style={{ minHeight: 44 }}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function VendorsPage() {
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("value");

  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  const totalSpending = data?.total_value ?? 0;

  // Filter and sort vendors
  const vendors = useMemo(() => {
    if (!data?.top_vendors) return [];
    let filtered = [...data.top_vendors];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((v) => v.supplier.toLowerCase().includes(q));
    }

    // Sort
    switch (sortBy) {
      case "value":
        filtered.sort((a, b) => b.total_value - a.total_value);
        break;
      case "count":
        filtered.sort((a, b) => b.count - a.count);
        break;
      case "name":
        filtered.sort((a, b) => a.supplier.localeCompare(b.supplier));
        break;
    }

    return filtered.slice(0, 20);
  }, [data, searchQuery, sortBy]);

  // Stats for summary bar
  const vendorStats = useMemo(() => {
    if (!data?.top_vendors) return null;
    const all = [...data.top_vendors].sort((a, b) => b.total_value - a.total_value);
    const topVendor = all[0];
    const topPct = topVendor && totalSpending > 0
      ? ((topVendor.total_value / totalSpending) * 100).toFixed(1)
      : "0";
    return {
      totalVendors: all.length,
      topVendor,
      topPct,
    };
  }, [data, totalSpending]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t("public.top20", locale)}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Search, sort, and explore the companies that hold Richmond&apos;s biggest contracts.
          Click any vendor to see their full contract history.
        </p>
      </div>

      <Disclaimer locale={locale} />

      {/* Vendor stats summary bar */}
      {vendorStats && (
        <section aria-label="Vendor statistics summary">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">{vendorStats.totalVendors}</strong> unique vendors
              </span>
            </div>
            {vendorStats.topVendor && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Top vendor holds <strong className="text-slate-900 dark:text-slate-100">{vendorStats.topPct}%</strong> of total spending
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search + Sort controls */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <label htmlFor="vendor-search" className="sr-only">Search vendors by name</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            id="vendor-search"
            type="text"
            placeholder="Search vendors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-base bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            style={{ minHeight: 44 }}
          />
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Sort by:</span>
          <SortButton label="Total Value" field="value" activeField={sortBy} onClick={setSortBy} />
          <SortButton label="Contract Count" field="count" activeField={sortBy} onClick={setSortBy} />
          <SortButton label="A-Z" field="name" activeField={sortBy} onClick={setSortBy} />
        </div>
      </div>

      {/* Vendor grid */}
      {isLoading ? (
        <div aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            Showing {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
            {searchQuery.trim() ? ` matching "${searchQuery}"` : ""}
          </p>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0"
            aria-label={t("public.topVendors", locale)}
          >
            {vendors.map((vendor, index) => (
              <li key={vendor.supplier}>
                <EnhancedVendorCard
                  vendor={vendor}
                  rank={index + 1}
                  totalSpending={totalSpending}
                />
              </li>
            ))}
          </ul>
        </>
      ) : searchQuery.trim() ? (
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-500 dark:text-slate-400 text-base">
              No vendors found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              style={{ minHeight: 44 }}
            >
              Clear search
            </button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-base">No vendor data available.</p>
      )}
    </div>
  );
}
