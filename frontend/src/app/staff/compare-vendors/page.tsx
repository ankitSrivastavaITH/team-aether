"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GitCompare,
  Search,
  Building2,
  DollarSign,
  FileText,
  Calendar,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorData {
  supplier: string;
  contracts: Array<Record<string, unknown>>;
  count: number;
  total_value: number;
  first_contract: string | null;
  last_expiry: string | null;
  departments_served: number | string | unknown[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getDepartmentsCount(departments_served: number | string | unknown[]): number {
  if (typeof departments_served === "number") return departments_served;
  if (Array.isArray(departments_served)) return departments_served.length;
  const n = parseInt(String(departments_served), 10);
  return isNaN(n) ? 0 : n;
}

function getRiskProfile(contracts: Array<Record<string, unknown>>): {
  critical: number;
  warning: number;
  ok: number;
  unknown: number;
} {
  const profile = { critical: 0, warning: 0, ok: 0, unknown: 0 };
  for (const c of contracts) {
    const risk = String(c.risk_level ?? "").toLowerCase();
    if (risk === "critical") profile.critical++;
    else if (risk === "warning" || risk === "high") profile.warning++;
    else if (risk === "ok" || risk === "low") profile.ok++;
    else profile.unknown++;
  }
  return profile;
}

function getAvgValue(totalValue: number, count: number): number {
  if (count === 0) return 0;
  return totalValue / count;
}

// ---------------------------------------------------------------------------
// VendorSearchInput
// ---------------------------------------------------------------------------

function VendorSearchInput({
  id,
  label,
  value,
  onChange,
  onSearch,
  isLoading,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  error: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id={id}
            type="search"
            placeholder="Enter vendor name…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            className="pl-9 h-11 text-base focus:ring-2 focus:ring-blue-500"
            aria-label={label}
          />
        </div>
        <Button
          onClick={onSearch}
          disabled={!value.trim() || isLoading}
          className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500"
          aria-label={`Search for ${label}`}
        >
          {isLoading ? "Loading…" : "Search"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Vendor not found or error loading data.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatRow — for comparing individual stats
// ---------------------------------------------------------------------------

function StatRow({
  icon: Icon,
  label,
  leftValue,
  rightValue,
  leftRaw,
  rightRaw,
}: {
  icon: React.ElementType;
  label: string;
  leftValue: string;
  rightValue: string;
  leftRaw: number;
  rightRaw: number;
}) {
  const leftWins = leftRaw > rightRaw;
  const rightWins = rightRaw > leftRaw;

  return (
    <div className="grid grid-cols-3 items-center gap-2 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div
        className={`text-right text-sm font-semibold ${
          leftWins ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {leftValue}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-tight">
          {label}
        </span>
      </div>
      <div
        className={`text-left text-sm font-semibold ${
          rightWins ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {rightValue}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VendorCard
// ---------------------------------------------------------------------------

function VendorCard({ vendor, side }: { vendor: VendorData; side: "left" | "right" }) {
  const riskProfile = getRiskProfile(vendor.contracts);
  const avgValue = getAvgValue(vendor.total_value, vendor.count);
  const deptCount = getDepartmentsCount(vendor.departments_served);
  const borderCls =
    side === "left"
      ? "border-blue-200 dark:border-blue-800"
      : "border-violet-200 dark:border-violet-800";
  const headerCls =
    side === "left"
      ? "bg-blue-600 dark:bg-blue-700"
      : "bg-violet-600 dark:bg-violet-700";

  return (
    <Card className={`overflow-hidden border-2 ${borderCls}`}>
      <div className={`px-5 py-4 ${headerCls}`}>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
          <h3 className="text-base font-bold text-white truncate">{vendor.supplier}</h3>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Contracts</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{vendor.count}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(vendor.total_value)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Avg: {formatCurrency(avgValue)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Layers className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Departments Served</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{deptCount}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">First Contract</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(vendor.first_contract)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Last expiry: {formatDate(vendor.last_expiry)}
            </p>
          </div>
        </div>

        {/* Risk profile */}
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="w-full">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Risk Profile</p>
            <div className="flex flex-wrap gap-2">
              {riskProfile.critical > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
                  {riskProfile.critical} Critical
                </span>
              )}
              {riskProfile.warning > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                  {riskProfile.warning} Warning
                </span>
              )}
              {riskProfile.ok > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
                  {riskProfile.ok} OK
                </span>
              )}
              {riskProfile.critical === 0 && riskProfile.warning === 0 && riskProfile.ok === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">No risk data</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Comparison table
// ---------------------------------------------------------------------------

function ComparisonTable({
  left,
  right,
}: {
  left: VendorData;
  right: VendorData;
}) {
  const leftAvg = getAvgValue(left.total_value, left.count);
  const rightAvg = getAvgValue(right.total_value, right.count);
  const leftDepts = getDepartmentsCount(left.departments_served);
  const rightDepts = getDepartmentsCount(right.departments_served);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
        Head-to-Head Comparison
      </h3>
      <div className="grid grid-cols-3 gap-1 mb-2">
        <div className="text-right text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
          {left.supplier}
        </div>
        <div />
        <div className="text-left text-xs font-bold text-violet-600 dark:text-violet-400 truncate">
          {right.supplier}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <StatRow
          icon={FileText}
          label="Contracts"
          leftValue={left.count.toLocaleString()}
          rightValue={right.count.toLocaleString()}
          leftRaw={left.count}
          rightRaw={right.count}
        />
        <StatRow
          icon={DollarSign}
          label="Total Value"
          leftValue={formatCurrency(left.total_value)}
          rightValue={formatCurrency(right.total_value)}
          leftRaw={left.total_value}
          rightRaw={right.total_value}
        />
        <StatRow
          icon={DollarSign}
          label="Avg Contract"
          leftValue={formatCurrency(leftAvg)}
          rightValue={formatCurrency(rightAvg)}
          leftRaw={leftAvg}
          rightRaw={rightAvg}
        />
        <StatRow
          icon={Layers}
          label="Departments"
          leftValue={String(leftDepts)}
          rightValue={String(rightDepts)}
          leftRaw={leftDepts}
          rightRaw={rightDepts}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CompareVendorsPage() {
  const [vendor1Input, setVendor1Input] = useState("");
  const [vendor2Input, setVendor2Input] = useState("");
  const [vendor1Query, setVendor1Query] = useState("");
  const [vendor2Query, setVendor2Query] = useState("");

  const {
    data: vendor1Data,
    isLoading: loading1,
    isError: error1,
  } = useQuery<VendorData>({
    queryKey: ["vendor-compare", vendor1Query],
    queryFn: () =>
      fetchAPI<VendorData>(`/api/contracts/vendor/${encodeURIComponent(vendor1Query)}`),
    enabled: !!vendor1Query,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: vendor2Data,
    isLoading: loading2,
    isError: error2,
  } = useQuery<VendorData>({
    queryKey: ["vendor-compare", vendor2Query],
    queryFn: () =>
      fetchAPI<VendorData>(`/api/contracts/vendor/${encodeURIComponent(vendor2Query)}`),
    enabled: !!vendor2Query,
    staleTime: 5 * 60 * 1000,
  });

  const bothLoaded = !!vendor1Data && !!vendor2Data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <GitCompare className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          Vendor Comparison
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Search for two vendors to compare their contract portfolios side by side.
        </p>
      </div>

      {/* Search inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VendorSearchInput
          id="vendor1-input"
          label="Vendor A"
          value={vendor1Input}
          onChange={setVendor1Input}
          onSearch={() => setVendor1Query(vendor1Input.trim())}
          isLoading={loading1}
          error={!!error1 && !!vendor1Query}
        />
        <VendorSearchInput
          id="vendor2-input"
          label="Vendor B"
          value={vendor2Input}
          onChange={setVendor2Input}
          onSearch={() => setVendor2Query(vendor2Input.trim())}
          isLoading={loading2}
          error={!!error2 && !!vendor2Query}
        />
      </div>

      {/* Placeholder when nothing searched yet */}
      {!vendor1Query && !vendor2Query && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-600">
          <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">Enter two vendor names above to start comparing.</p>
          <p className="text-xs mt-1">Tip: Use exact vendor names from the Contracts table.</p>
        </div>
      )}

      {/* Comparison view */}
      {(vendor1Data || vendor2Data) && (
        <div className="flex flex-col gap-6">
          {/* Side-by-side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor1Data ? (
              <VendorCard vendor={vendor1Data} side="left" />
            ) : vendor1Query && !loading1 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-sm">
                No data for this vendor
              </div>
            ) : loading1 ? (
              <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" aria-busy="true" aria-label="Loading vendor A" />
            ) : null}

            {vendor2Data ? (
              <VendorCard vendor={vendor2Data} side="right" />
            ) : vendor2Query && !loading2 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-sm">
                No data for this vendor
              </div>
            ) : loading2 ? (
              <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" aria-busy="true" aria-label="Loading vendor B" />
            ) : null}
          </div>

          {/* Comparison table (only when both loaded) */}
          {bothLoaded && (
            <ComparisonTable left={vendor1Data} right={vendor2Data} />
          )}
        </div>
      )}
    </div>
  );
}
