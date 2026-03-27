"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FileUp, Search, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Disclaimer } from "@/components/disclaimer";
import { RiskAlerts } from "@/components/risk-alerts";
import { RiskNarrative } from "@/components/ai-insights";
import { ExpiryTimelineChart } from "@/components/analytics-charts";
import { NLQueryBar } from "@/components/nl-query-bar";
import { ContractsTable } from "@/components/contracts-table";
import { ContractDetail } from "@/components/contract-detail";
import { ConcentrationRisk } from "@/components/concentration-risk";
import { useContracts, useContractStats, useDepartments, type Contract } from "@/hooks/use-contracts";
import { API_BASE } from "@/lib/api";
import { ExtractedContracts } from "@/components/extracted-contracts";

const PAGE_SIZE = 50;

function StaffDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [maxDays, setMaxDays] = useState(searchParams.get("max_days") || "all");
  const [department, setDepartment] = useState(searchParams.get("department") || "all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Sync filter state to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (maxDays && maxDays !== "all") params.set("max_days", maxDays);
    if (department && department !== "all") params.set("department", department);
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    // Reset to first page when filters change
    setPage(1);
  }, [search, maxDays, department, pathname, router]);

  // Build API params
  const contractParams: Record<string, string | number> = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  if (search.trim()) contractParams.search = search.trim();
  if (maxDays !== "all") contractParams.max_days = Number(maxDays);
  if (department !== "all") contractParams.department = department;

  const { data: contractsData, isLoading: contractsLoading, isError: contractsError } = useContracts(contractParams);
  const { data: stats, isLoading: statsLoading } = useContractStats();
  const { data: departmentsData } = useDepartments();

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
    setDepartment("all");
    setPage(1);
  }, []);

  function handleExport() {
    const params = new URLSearchParams();
    if (maxDays && maxDays !== "all") params.set("max_days", maxDays);
    if (department && department !== "all") params.set("department", department);
    if (search) params.set("search", search);
    window.open(`${API_BASE}/api/contracts/export?${params.toString()}`, "_blank");
  }

  const hasActiveFilters = search.trim() !== "" || maxDays !== "all" || department !== "all";

  // Departments list
  const departmentList: string[] = Array.isArray(departmentsData)
    ? departmentsData.flatMap((d) => {
        if (typeof d === "string") return [d];
        if (d && typeof d === "object" && "department" in d) return [(d as { department: string }).department];
        return [];
      }).filter(Boolean)
    : [];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Staff Dashboard — Contract Risk
            </h1>
            <p className="text-base text-slate-500 mt-1">
              Monitor contract expirations and procurement risk across departments.
            </p>
          </div>
          <Link
            href="/staff/extract"
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] shrink-0"
          >
            <FileUp className="h-5 w-5" aria-hidden="true" />
            PDF Extractor
          </Link>
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        {/* Risk Alert Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" aria-busy="true" aria-label="Loading risk summary">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <RiskAlerts
            totalContracts={(stats.total_contracts as number) ?? 0}
            totalValue={(stats.total_value as number) ?? 0}
            expiring30={(stats.expiring_30 as number) ?? (stats.expiring_soon as number) ?? 0}
            expiring60={(stats.expiring_60 as number) ?? 0}
            expiring90={(stats.expiring_90 as number) ?? 0}
          />
        ) : null}

        {/* AI Risk Narrative */}
        <RiskNarrative />

        {/* Expiry Timeline */}
        <section aria-labelledby="expiry-timeline-heading">
          <h2 id="expiry-timeline-heading" className="text-xl font-semibold text-slate-800 mb-4">
            Upcoming Expirations
          </h2>
          <ExpiryTimelineChart />
        </section>

        {/* Natural Language Query */}
        <NLQueryBar />

        {/* Filter Bar */}
        <section aria-label="Contract filters">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Contracts</h2>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
                className="pl-9 h-11 text-base focus:ring-3 focus:ring-blue-500"
              />
            </div>

            {/* Expiry filter */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label htmlFor="expiry-select" className="text-sm font-medium text-slate-700 sr-only">
                Expiry window
              </label>
              <Select value={maxDays} onValueChange={(v) => setMaxDays(v ?? "all")}>
                <SelectTrigger
                  id="expiry-select"
                  aria-label="Filter by expiry window"
                  className="h-11 text-base focus:ring-3 focus:ring-blue-500 min-w-[160px]"
                >
                  <SelectValue placeholder="Expiry window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All expiry dates</SelectItem>
                  <SelectItem value="30">Expiring ≤30 days</SelectItem>
                  <SelectItem value="60">Expiring ≤60 days</SelectItem>
                  <SelectItem value="90">Expiring ≤90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department filter */}
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label htmlFor="department-select" className="text-sm font-medium text-slate-700 sr-only">
                Department
              </label>
              <Select value={department} onValueChange={(v) => setDepartment(v ?? "all")}>
                <SelectTrigger
                  id="department-select"
                  aria-label="Filter by department"
                  className="h-11 text-base focus:ring-3 focus:ring-blue-500 min-w-[200px]"
                >
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentList.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export CSV button */}
            <Button
              variant="outline"
              onClick={handleExport}
              className="h-11 px-4 text-base focus:ring-3 focus:ring-blue-500 min-w-[44px] gap-2"
              aria-label="Export filtered contracts as CSV"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>

            {/* Clear button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-11 px-4 text-base focus:ring-3 focus:ring-blue-500 min-w-[44px] gap-2"
                aria-label="Clear all filters"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>
        </section>

        {/* Results count */}
        <p className="text-base text-slate-600" aria-live="polite" aria-atomic="true">
          {contractsLoading
            ? "Loading contracts…"
            : contractsError
            ? "Error loading contracts."
            : `Showing ${contracts.length.toLocaleString()} of ${total.toLocaleString()} contract${total !== 1 ? "s" : ""}`}
        </p>

        {/* Contracts Table */}
        {contractsLoading ? (
          <div className="rounded-xl ring-1 ring-slate-200 bg-white p-8 text-center" aria-busy="true">
            <p className="text-base text-slate-500">Loading contracts…</p>
          </div>
        ) : contractsError ? (
          <div className="rounded-xl ring-1 ring-red-200 bg-red-50 p-8 text-center" role="alert">
            <p className="text-base text-red-700">
              Unable to load contract data right now. This usually resolves in a few minutes. If the problem persists, please contact your administrator.
            </p>
          </div>
        ) : (
          <ContractsTable contracts={contracts} onRowClick={handleRowClick} />
        )}

        {/* Pagination */}
        {!contractsLoading && !contractsError && totalPages > 1 && (
          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Contract table pagination"
          >
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-[44px] px-4 text-base focus:ring-3 focus:ring-blue-500"
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            <p className="text-sm text-slate-600" aria-live="polite" aria-atomic="true">
              Page {page} of {totalPages}
            </p>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-[44px] px-4 text-base focus:ring-3 focus:ring-blue-500"
              aria-label="Go to next page"
            >
              Next
            </Button>
          </nav>
        )}

        {/* Risk Analysis */}
        <section aria-labelledby="risk-analysis-heading">
          <h2 id="risk-analysis-heading" className="text-xl font-semibold text-slate-800 mb-4">
            Risk Analysis
          </h2>
          <ConcentrationRisk />
        </section>
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

export default function StaffDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-10 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <StaffDashboardContent />
    </Suspense>
  );
}
