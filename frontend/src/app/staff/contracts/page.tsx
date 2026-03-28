"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractsTable } from "@/components/contracts-table";
import { ContractDetail } from "@/components/contract-detail";
import { DepartmentChartFilter } from "@/components/chart-filter";
import { TableSkeleton } from "@/components/skeletons";
import { useContracts, useDepartments, type Contract } from "@/hooks/use-contracts";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

const PAGE_SIZE = 50;

function ContractsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [maxDays, setMaxDays] = useState(searchParams.get("max_days") || "all");
  const [departments, setDepartments] = useState<string[]>(
    searchParams.get("department") ? [searchParams.get("department")!] : []
  );
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [chartOpen, setChartOpen] = useState(false);

  // Sync filter state to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (maxDays && maxDays !== "all") params.set("max_days", maxDays);
    if (departments.length === 1) params.set("department", departments[0]);
    else if (departments.length > 1) params.set("department", departments.join(","));
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    setPage(1);
  }, [search, maxDays, departments, pathname, router]);

  // Build API params
  const contractParams: Record<string, string | number> = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  if (search.trim()) contractParams.search = search.trim();
  if (maxDays !== "all") contractParams.max_days = Number(maxDays);
  if (departments.length === 1) contractParams.department = departments[0];

  const { data: contractsData, isLoading: contractsLoading, isError: contractsError } = useContracts(contractParams);
  // useDepartments kept for potential future use but not rendered in SmartFilter
  useDepartments();

  const contracts = contractsData?.contracts ?? [];
  const total = contractsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRowClick = useCallback((contract: Contract) => {
    setSelectedContract(contract);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setMaxDays("all");
    setDepartments([]);
    setPage(1);
  }, []);

  function handleExport() {
    const params = new URLSearchParams();
    if (maxDays && maxDays !== "all") params.set("max_days", maxDays);
    if (departments.length === 1) params.set("department", departments[0]);
    if (search) params.set("search", search);
    window.open(`${API_BASE}/api/contracts/export?${params.toString()}`, "_blank");
    toast.success("CSV export started", { description: "Your download should begin shortly." });
  }

  const hasActiveFilters = search.trim() !== "" || maxDays !== "all" || departments.length > 0;

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* Zone 1: Header + quick filters */}
        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Contracts</h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                Search, filter, and explore all City of Richmond contracts.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-10 px-4 text-sm shrink-0 gap-2 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Export filtered contracts as CSV"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
          </div>

          {/* Filter row */}
          <section aria-label="Contract filters">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <label htmlFor="search-input" className="sr-only">
                  Search contracts by vendor or keyword
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="search-input"
                  type="search"
                  placeholder="Search vendor or keyword…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                />
              </div>

              {/* Expiry filter */}
              <div className="min-w-[160px]">
                <label htmlFor="expiry-select" className="sr-only">
                  Expiry window
                </label>
                <Select value={maxDays} onValueChange={(v) => setMaxDays(v ?? "all")}>
                  <SelectTrigger
                    id="expiry-select"
                    aria-label="Filter by expiry window"
                    className="h-10 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
                  >
                    <SelectValue placeholder="Expiry: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Expiry: All</SelectItem>
                    <SelectItem value="30">Expiring ≤30 days</SelectItem>
                    <SelectItem value="60">Expiring ≤60 days</SelectItem>
                    <SelectItem value="90">Expiring ≤90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-10 px-4 text-sm gap-2 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </div>
          </section>
        </div>

        {/* Zone 2: Department chart filter (collapsible) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setChartOpen((o) => !o)}
            aria-expanded={chartOpen}
            aria-controls="chart-filter-panel"
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            <span>
              Filter by Department
              {departments.length > 0 && (
                <span className="ml-1 text-blue-600 dark:text-blue-400">
                  ({departments.length} selected)
                </span>
              )}
            </span>
            {chartOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
            )}
          </button>

          {/* Active filter badges (always visible when departments are selected) */}
          {departments.length > 0 && (
            <div
              className="flex gap-2 flex-wrap px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              aria-label="Active department filters"
            >
              {departments.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => setDepartments((prev) => prev.filter((x) => x !== d))}
                    aria-label={`Remove ${d} filter`}
                    className="ml-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 p-0.5"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Chart content */}
          {chartOpen && (
            <div id="chart-filter-panel" className="border-t border-slate-200 dark:border-slate-700">
              <DepartmentChartFilter selected={departments} onChange={setDepartments} />
            </div>
          )}
        </div>

        {/* Zone 3: Results count + pagination inline, then table */}
        <div className="flex flex-col gap-3">
          {/* Results count + pagination on same line */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p
              className="text-sm text-slate-600 dark:text-slate-400"
              aria-live="polite"
              aria-atomic="true"
            >
              {contractsLoading
                ? "Loading contracts…"
                : contractsError
                ? "Error loading contracts."
                : `Showing ${contracts.length.toLocaleString()} of ${total.toLocaleString()} contract${total !== 1 ? "s" : ""}`}
            </p>

            {!contractsLoading && !contractsError && totalPages > 1 && (
              <nav
                className="flex items-center gap-2"
                aria-label="Contract table pagination"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                  Page {page} of {totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 p-0 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="Go to previous page"
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 p-0 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="Go to next page"
                >
                  →
                </Button>
              </nav>
            )}
          </div>

          {/* Contracts Table */}
          {contractsLoading ? (
            <TableSkeleton rows={8} />
          ) : contractsError ? (
            <div className="rounded-xl ring-1 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-red-950/40 p-8 text-center" role="alert">
              <p className="text-base text-red-700 dark:text-red-300">
                Unable to load contract data right now. This usually resolves in a few minutes. If the problem persists, please contact your administrator.
              </p>
            </div>
          ) : (
            <ContractsTable contracts={contracts} onRowClick={handleRowClick} />
          )}
        </div>
      </div>

      {/* Contract Detail Drawer */}
      <ContractDetail
        contract={selectedContract}
        open={detailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
}

export default function ContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <ContractsPageContent />
    </Suspense>
  );
}
