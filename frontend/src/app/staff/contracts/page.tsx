"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, Download } from "lucide-react";
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
import { SmartFilter } from "@/components/smart-filter";
import { useContracts, useDepartments, type Contract } from "@/hooks/use-contracts";
import { formatCurrency } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

const PAGE_SIZE = 50;

function ContractsPageContent() {
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
          <p className="text-base text-slate-500 mt-1">
            Search, filter, and explore all City of Richmond contracts.
          </p>
        </div>

        {/* Summary chips */}
        {!contractsLoading && contracts.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap text-sm" aria-label="Filtered contract statistics">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              {total.toLocaleString()} contracts
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
              {formatCurrency(contracts.reduce((sum, c) => sum + ((c as Record<string, unknown>).amount as number || (c as Record<string, unknown>).contract_amount as number || 0), 0))}
            </span>
            {contracts.length > 0 && (
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                Avg: {formatCurrency(
                  contracts.reduce((sum, c) => sum + ((c as Record<string, unknown>).amount as number || (c as Record<string, unknown>).contract_amount as number || 0), 0) / contracts.length
                )}
              </span>
            )}
            {contracts.some((c) => typeof (c as Record<string, unknown>).days_until_expiry === "number" && ((c as Record<string, unknown>).days_until_expiry as number) >= 0) && (
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                Soonest: {Math.min(
                  ...contracts
                    .filter((c) => typeof (c as Record<string, unknown>).days_until_expiry === "number" && ((c as Record<string, unknown>).days_until_expiry as number) >= 0)
                    .map((c) => (c as Record<string, unknown>).days_until_expiry as number)
                )} days
              </span>
            )}
          </div>
        )}

        {/* Smart Filter */}
        <SmartFilter
          departments={departmentList}
          onApply={(filters) => {
            if (filters.search !== undefined) setSearch(filters.search);
            if (filters.maxDays !== undefined) setMaxDays(filters.maxDays);
            if (filters.department !== undefined) setDepartment(filters.department);
          }}
          onClear={handleClearFilters}
        />

        {/* Filter Bar */}
        <section aria-label="Contract filters">
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
          <div className="h-10 w-64 bg-slate-100 rounded animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <ContractsPageContent />
    </Suspense>
  );
}
