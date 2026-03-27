"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FileUp, Search, X } from "lucide-react";
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
import { NLQueryBar } from "@/components/nl-query-bar";
import { ContractsTable } from "@/components/contracts-table";
import { ContractDetail } from "@/components/contract-detail";
import { useContracts, useContractStats, useDepartments, type Contract } from "@/hooks/use-contracts";

export default function StaffDashboard() {
  const [search, setSearch] = useState("");
  const [maxDays, setMaxDays] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Build API params
  const contractParams: Record<string, string | number> = { limit: 200 };
  if (search.trim()) contractParams.search = search.trim();
  if (maxDays !== "all") contractParams.max_days = Number(maxDays);
  if (department !== "all") contractParams.department = department;

  const { data: contractsData, isLoading: contractsLoading, isError: contractsError } = useContracts(contractParams);
  const { data: stats, isLoading: statsLoading } = useContractStats();
  const { data: departmentsData } = useDepartments();

  const contracts = contractsData?.contracts ?? [];
  const total = contractsData?.total ?? 0;

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
  }, []);

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
