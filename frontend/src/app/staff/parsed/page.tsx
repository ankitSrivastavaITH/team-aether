"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Search, FileText, Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";
import { VendorSelect } from "@/components/vendor-select";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BatchStats {
  total: number;
  ifb_count: number;
  rfp_count: number;
  cooperative_count: number;
  has_renewal_info: number;
  has_term_info: number;
  has_requisition: number;
}

interface BatchStatsResponse {
  stats: BatchStats;
}

interface ParsedFields {
  solicitation_number: string | null;
  procurement_method: string | null;
  original_term: string | null;
  renewal_structure: string | null;
  total_possible_term: string | null;
  scope_summary: string | null;
  key_details: string[];
}

interface ParsedContractResponse {
  contract_number: string;
  raw_description: string;
  parsed: ParsedFields;
  supplier: string | null;
  department: string | null;
  value: number | null;
  disclaimer: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  value,
  label,
  of,
  colorClass,
  searchTerm,
  active,
  onClick,
}: {
  value: number;
  label: string;
  of: number;
  colorClass: string;
  searchTerm?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0;

  return (
    <button
      onClick={onClick}
      disabled={!searchTerm}
      className={`flex flex-col gap-1 rounded-xl p-4 text-left transition-all ${
        active
          ? "bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-600 shadow-sm"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
      } ${searchTerm ? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm" : ""}`}
      aria-label={`${value} contracts ${label}. ${searchTerm ? "Click to view." : ""}`}
      aria-pressed={active}
    >
      <span className={`text-2xl font-bold ${colorClass}`}>{value.toLocaleString()}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5" aria-hidden="true">
          <div
            className={`h-1.5 rounded-full ${colorClass.replace("text-", "bg-")}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{pct}%</span>
      </div>
      {searchTerm && (
        <span className={`text-[10px] mt-1 flex items-center gap-1 ${active ? "text-blue-600 dark:text-blue-400 font-medium" : "text-blue-500 dark:text-blue-400"}`}>
          <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" /> {active ? "Showing below ↓" : "Click to view"}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Term flow (reused from contract-detail)
// ---------------------------------------------------------------------------

function TermFlow({
  original,
  renewal,
  total,
}: {
  original: string | null;
  renewal: string | null;
  total: string | null;
}) {
  const steps = [
    { label: "Original term", value: original },
    { label: "Renewals", value: renewal },
    { label: "Total possible", value: total },
  ].filter((s) => s.value);

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label="Contract term structure">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {step.label}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {step.value}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight
              className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-3 shrink-0"
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parse result panel
// ---------------------------------------------------------------------------

function ParseResult({ contractNumber }: { contractNumber: string }) {
  const { data, isLoading, isError } = useQuery<ParsedContractResponse>({
    queryKey: ["parsed-contract", contractNumber],
    queryFn: () =>
      fetchAPI<ParsedContractResponse>(
        `/api/parser/parse/${encodeURIComponent(contractNumber)}`
      ),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(contractNumber),
  });

  if (isLoading) {
    return (
      <div
        className="space-y-3 mt-4"
        aria-busy="true"
        aria-label="Parsing contract description"
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"
          />
        ))}
        <p className="text-sm text-slate-400 dark:text-slate-500">
          AI is extracting structured fields from the contract description…
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        role="alert"
        className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400"
      >
        Could not parse this contract. Check that the contract number is correct and try again.
      </div>
    );
  }

  if (data.error) {
    return (
      <div
        role="alert"
        className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400"
      >
        {data.error === "Contract not found"
          ? `No contract found with number "${contractNumber}".`
          : data.error}
      </div>
    );
  }

  const p = data.parsed;

  return (
    <div className="mt-4 space-y-5">
      {/* Header: vendor + department */}
      <div className="flex flex-wrap gap-2 items-start">
        {data.supplier && (
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {data.supplier}
          </span>
        )}
        {data.department && (
          <span className="text-sm text-slate-500 dark:text-slate-400 self-center">
            — {data.department}
          </span>
        )}
      </div>

      {/* Badges row */}
      {(p.solicitation_number || p.procurement_method) && (
        <div className="flex flex-wrap gap-2">
          {p.solicitation_number && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
              aria-label={`Solicitation number: ${p.solicitation_number}`}
            >
              {p.solicitation_number}
            </span>
          )}
          {p.procurement_method && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
              aria-label={`Procurement method: ${p.procurement_method}`}
            >
              {p.procurement_method}
            </span>
          )}
        </div>
      )}

      {/* Scope summary */}
      {p.scope_summary && (
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide text-[10px]">
            Scope
          </p>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {p.scope_summary}
          </p>
        </div>
      )}

      {/* Term flow */}
      {(p.original_term || p.renewal_structure || p.total_possible_term) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Contract Duration
          </p>
          <TermFlow
            original={p.original_term}
            renewal={p.renewal_structure}
            total={p.total_possible_term}
          />
        </div>
      )}

      {/* Key details */}
      {p.key_details && p.key_details.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Key Details
          </p>
          <ul className="space-y-1.5" aria-label="Key contract details">
            {p.key_details.map((detail, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 dark:bg-violet-500 shrink-0"
                  aria-hidden="true"
                />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw description */}
      {data.raw_description && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 select-none">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Show raw description
          </summary>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900 rounded-md p-3 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
            {data.raw_description}
          </p>
        </details>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5">
        <Info
          className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParsedPage() {
  const [vendor, setVendor] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [filterTerm, setFilterTerm] = useState<string | null>(null);

  // Fetch contracts matching the selected stat card filter
  const { data: filteredContracts } = useQuery({
    queryKey: ["filtered-parsed", filterTerm],
    queryFn: () => fetchAPI<{ contracts: Array<Record<string, unknown>>; total: number }>("/api/contracts", { search: filterTerm!, limit: 10 }),
    enabled: Boolean(filterTerm),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch contracts for selected vendor
  const { data: vendorContracts } = useQuery({
    queryKey: ["vendor-contracts-for-parse", vendor],
    queryFn: () => fetchAPI<{ contracts: Array<Record<string, unknown>> }>(`/api/contracts/vendor/${encodeURIComponent(vendor)}`),
    enabled: Boolean(vendor),
    staleTime: 5 * 60 * 1000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<BatchStatsResponse>({
    queryKey: ["parser-batch-stats"],
    queryFn: () => fetchAPI<BatchStatsResponse>("/api/parser/batch-stats"),
    staleTime: 10 * 60 * 1000,
  });

  const stats = statsData?.stats;
  const total = stats?.total ?? 0;

  // Contract selection handled via vendor dropdown → contract list

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Brain
            className="h-7 w-7 text-violet-600 dark:text-violet-400"
            aria-hidden="true"
          />
          Contract Intel
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          AI-powered parsing of free-text contract descriptions — extracts solicitation
          numbers, procurement methods, and term structures.
        </p>
      </div>

      {/* Disclaimer card */}
      <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info
              className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Note:{" "}
              </span>
              All extracted fields are AI-generated and may contain errors. Verify against
              the original solicitation documents before making procurement decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Batch stats */}
      <section aria-label="Description parsing coverage">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
          Parsing Coverage — {total.toLocaleString()} Contracts
        </h2>

        {statsLoading && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            aria-busy="true"
            aria-label="Loading statistics"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {!statsLoading && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard value={stats.ifb_count} label="Have IFB numbers" of={total} colorClass="text-violet-600 dark:text-violet-400" searchTerm="IFB" active={filterTerm === "IFB"} onClick={() => setFilterTerm(filterTerm === "IFB" ? null : "IFB")} />
            <StatCard value={stats.rfp_count} label="Have RFP references" of={total} colorClass="text-blue-600 dark:text-blue-400" searchTerm="RFP" active={filterTerm === "RFP"} onClick={() => setFilterTerm(filterTerm === "RFP" ? null : "RFP")} />
            <StatCard value={stats.cooperative_count} label="Cooperative agreements" of={total} colorClass="text-emerald-600 dark:text-emerald-400" searchTerm="cooperative" active={filterTerm === "cooperative"} onClick={() => setFilterTerm(filterTerm === "cooperative" ? null : "cooperative")} />
            <StatCard value={stats.has_renewal_info} label="Have renewal info" of={total} colorClass="text-amber-600 dark:text-amber-400" searchTerm="renewal" active={filterTerm === "renewal"} onClick={() => setFilterTerm(filterTerm === "renewal" ? null : "renewal")} />
            <StatCard value={stats.has_term_info} label="Have term info" of={total} colorClass="text-cyan-600 dark:text-cyan-400" searchTerm="year" active={filterTerm === "year"} onClick={() => setFilterTerm(filterTerm === "year" ? null : "year")} />
            <StatCard value={stats.has_requisition} label="Have requisition refs" of={total} colorClass="text-rose-600 dark:text-rose-400" searchTerm="requisition" active={filterTerm === "requisition"} onClick={() => setFilterTerm(filterTerm === "requisition" ? null : "requisition")} />
          </div>
        )}

        {/* Inline filtered contracts from stat card click */}
        {filterTerm && filteredContracts?.contracts && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 mt-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Contracts matching &ldquo;{filterTerm}&rdquo; ({filteredContracts.total} found)
                </h3>
                <button onClick={() => setFilterTerm(null)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Close
                </button>
              </div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredContracts.contracts.slice(0, 10).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { setContractNumber(String(c.contract_number)); setFilterTerm(null); }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-sm"
                    style={{ minHeight: 40 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{String(c.supplier || "Unknown")}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="font-mono text-xs text-slate-500">#{String(c.contract_number)}</span>
                      </div>
                      <span className="font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">{formatCurrency(c.value as number)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{String(c.description || "").slice(0, 100)}</p>
                  </button>
                ))}
              </div>
              {filteredContracts.total > 10 && (
                <p className="text-xs text-slate-400 mt-2 text-center">Showing 10 of {filteredContracts.total}. Click a contract to parse it.</p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Contract lookup — select vendor then pick contract */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              Parse Any Contract
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VendorSelect
            value={vendor}
            onChange={(v) => { setVendor(v); setContractNumber(""); }}
            label="1. Select a Vendor"
            placeholder="Pick a vendor..."
          />

          {vendor && vendorContracts?.contracts && vendorContracts.contracts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">2. Pick a contract to parse:</p>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {vendorContracts.contracts.map((c) => {
                  const cn = String(c.contract_number || "");
                  const isSelected = cn === contractNumber;
                  return (
                    <button
                      key={cn}
                      onClick={() => setContractNumber(cn)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                        isSelected
                          ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                      style={{ minHeight: 44 }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{cn}</span>
                          <p className="text-sm text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {String(c.description || "").slice(0, 80)}{String(c.description || "").length > 80 ? "…" : ""}
                          </p>
                        </div>
                        <span className="font-bold text-blue-700 dark:text-blue-400 flex-shrink-0 text-sm">
                          {formatCurrency(c.value as number)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {vendor && vendorContracts?.contracts?.length === 0 && (
            <p className="text-sm text-slate-400">No contracts found for this vendor.</p>
          )}

          {contractNumber && <ParseResult contractNumber={contractNumber} />}
        </CardContent>
      </Card>
    </div>
  );
}
