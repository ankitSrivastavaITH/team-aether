"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
// Link removed — public pages open in new tabs via <a target="_blank">
import { CalendarDays, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAPI } from "@/lib/api";
import { useDepartments } from "@/hooks/use-contracts";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_YEAR = 2020;
const MAX_YEAR = 2028;
const TOTAL_MONTHS = (MAX_YEAR - MIN_YEAR) * 12;

const YEAR_LABELS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contract {
  id?: string;
  contract_number?: string;
  supplier?: string;
  department?: string;
  value?: number;
  start_date?: string;
  end_date?: string;
  risk_level?: string;
  description?: string;
  [key: string]: unknown;
}

interface ContractsResponse {
  contracts: Contract[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateToPercent(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const months = (d.getFullYear() - MIN_YEAR) * 12 + d.getMonth();
  return Math.max(0, Math.min(100, (months / TOTAL_MONTHS) * 100));
}

function riskColor(risk: string | undefined): {
  bar: string;
  text: string;
  border: string;
  label: string;
} {
  switch ((risk ?? "").toLowerCase()) {
    case "critical":
      return {
        bar: "bg-red-500 dark:bg-red-600",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-300 dark:border-red-700",
        label: "Critical",
      };
    case "warning":
    case "high":
      return {
        bar: "bg-amber-400 dark:bg-amber-500",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-300 dark:border-amber-700",
        label: "Warning",
      };
    case "ok":
    case "low":
      return {
        bar: "bg-emerald-500 dark:bg-emerald-600",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-300 dark:border-emerald-700",
        label: "OK",
      };
    default:
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        text: "text-slate-600 dark:text-slate-400",
        border: "border-slate-300 dark:border-slate-600",
        label: "Expired",
      };
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Contract Row
// ---------------------------------------------------------------------------

function ContractRow({
  contract,
  onSelect,
  selected,
}: {
  contract: Contract;
  onSelect: (c: Contract) => void;
  selected: boolean;
}) {
  const startPct = dateToPercent(contract.start_date);
  const endPct = dateToPercent(contract.end_date);
  const widthPct = Math.max(0.5, endPct - startPct);
  const colors = riskColor(contract.risk_level);
  const label = contract.supplier ?? contract.contract_number ?? "Unknown";

  return (
    <div
      className={`flex items-center gap-2 min-h-[44px] px-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
        selected ? "bg-blue-50 dark:bg-blue-950/40" : ""
      }`}
      onClick={() => onSelect(contract)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${label}, ${colors.label} risk, ${formatDate(contract.start_date)} to ${formatDate(contract.end_date)}, ${formatCurrency(contract.value ?? 0)}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(contract);
        }
      }}
    >
      {/* Vendor label */}
      <div className="w-48 shrink-0 text-xs text-slate-700 dark:text-slate-300 truncate pr-2">
        {label}
      </div>

      {/* Timeline bar area */}
      <div className="flex-1 relative h-6 bg-slate-100 dark:bg-slate-800 rounded">
        {/* Year grid lines */}
        {YEAR_LABELS.map((yr) => {
          const pct = ((yr - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
          return (
            <div
              key={yr}
              className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
              style={{ left: `${pct}%` }}
              aria-hidden="true"
            />
          );
        })}

        {/* Contract bar */}
        <div
          className={`absolute top-1 bottom-1 rounded ${colors.bar} opacity-80 hover:opacity-100 transition-opacity`}
          style={{
            left: `${startPct}%`,
            width: `${widthPct}%`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Value */}
      <div className="w-24 shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
        {formatCurrency(contract.value ?? 0)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel
// ---------------------------------------------------------------------------

function DetailPanel({
  contract,
  onClose,
}: {
  contract: Contract;
  onClose: () => void;
}) {
  const colors = riskColor(contract.risk_level);

  return (
    <aside
      className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto"
      aria-label="Contract details"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Contract Details
        </h3>
        <button
          onClick={onClose}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close details panel"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Vendor */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Vendor</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {contract.supplier ?? "—"}
            </p>
            {contract.supplier && (
              <a
                href={`/public/vendor/${encodeURIComponent(contract.supplier)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={`View vendor page for ${contract.supplier}`}
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                View
              </a>
            )}
          </div>
        </div>

        {/* Contract number */}
        {contract.contract_number && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Contract #</p>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
              {contract.contract_number}
            </p>
          </div>
        )}

        {/* Department */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Department</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {contract.department ?? "—"}
          </p>
        </div>

        {/* Value */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Value</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(contract.value ?? 0)}
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Start Date</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {formatDate(contract.start_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">End Date</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {formatDate(contract.end_date)}
            </p>
          </div>
        </div>

        {/* Risk */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk Level</p>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors.text} ${colors.border}`}
          >
            {colors.label}
          </span>
        </div>

        {/* Description */}
        {contract.description && (
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Description</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {String(contract.description)}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TimelinePage() {
  const [department, setDepartment] = useState("all");
  const [selected, setSelected] = useState<Contract | null>(null);

  const { data: contractsData, isLoading, isError } = useQuery<ContractsResponse>({
    queryKey: ["timeline-contracts"],
    queryFn: () =>
      fetchAPI<ContractsResponse>("/api/contracts", { limit: 50, sort: "value_desc" }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: departmentsData } = useDepartments();

  const departments: string[] = useMemo(() => {
    if (!Array.isArray(departmentsData)) return [];
    return departmentsData.flatMap((d) => {
      if (typeof d === "string") return [d];
      if (d && typeof d === "object" && "department" in d)
        return [(d as { department: string }).department];
      return [];
    });
  }, [departmentsData]);

  const contracts = useMemo(() => {
    const all = contractsData?.contracts ?? [];
    if (department === "all") return all;
    return all.filter((c) => c.department === department);
  }, [contractsData, department]);

  const handleSelect = (c: Contract) => {
    setSelected((prev) =>
      prev && (prev.id ?? prev.contract_number) === (c.id ?? c.contract_number) ? null : c
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          Contract Timeline
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Top 50 contracts by value shown as a Gantt-style timeline from{" "}
          {MIN_YEAR} to {MAX_YEAR}. Click a row to see details.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="dept-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">
          Department:
        </label>
        <Select value={department} onValueChange={(v) => setDepartment(v ?? "all")}>
          <SelectTrigger
            id="dept-filter"
            aria-label="Filter by department"
            className="h-11 min-w-[220px] focus:ring-2 focus:ring-blue-500"
          >
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-slate-500 dark:text-slate-400">
          {contracts.length} contract{contracts.length !== 1 ? "s" : ""} shown
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400" role="list" aria-label="Risk level legend">
        {[
          { label: "Critical", cls: "bg-red-500" },
          { label: "Warning", cls: "bg-amber-400" },
          { label: "OK", cls: "bg-emerald-500" },
          { label: "Expired / Unknown", cls: "bg-slate-400" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5" role="listitem">
            <span className={`inline-block w-3 h-3 rounded-sm ${cls}`} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {/* Main panel */}
      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Timeline area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <CardHeader className="pb-2 sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
              <CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-48 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Vendor
                  </div>
                  {/* Year axis labels */}
                  <div className="flex-1 relative h-6">
                    {YEAR_LABELS.map((yr) => {
                      const pct = ((yr - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
                      return (
                        <span
                          key={yr}
                          className="absolute text-[10px] text-slate-400 dark:text-slate-500 -translate-x-1/2"
                          style={{ left: `${pct}%` }}
                          aria-hidden="true"
                        >
                          {yr}
                        </span>
                      );
                    })}
                  </div>
                  <div className="w-24 shrink-0 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Value
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="py-2">
              {isLoading && (
                <div
                  className="space-y-2"
                  aria-busy="true"
                  aria-label="Loading timeline data"
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                  ))}
                </div>
              )}

              {isError && (
                <div
                  role="alert"
                  className="p-6 text-center text-red-600 dark:text-red-400 text-sm"
                >
                  Unable to load contract timeline. Please try again.
                </div>
              )}

              {!isLoading && !isError && contracts.length === 0 && (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No contracts found for the selected department.
                </div>
              )}

              {!isLoading && !isError && contracts.length > 0 && (
                <div className="space-y-1" role="list" aria-label="Contract timeline rows">
                  {contracts.map((c, i) => (
                    <div key={c.id ?? c.contract_number ?? i} role="listitem">
                      <ContractRow
                        contract={c}
                        onSelect={handleSelect}
                        selected={
                          !!selected &&
                          (selected.id ?? selected.contract_number) ===
                            (c.id ?? c.contract_number)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel contract={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </Card>
    </div>
  );
}
