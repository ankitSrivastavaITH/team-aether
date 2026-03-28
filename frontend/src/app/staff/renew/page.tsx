"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  FileText,
  ShieldCheck,
  DollarSign,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Printer,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { VendorSelect } from "@/components/vendor-select";
import { ComplianceCheck } from "@/components/compliance-check";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contract {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  start_date: string;
  end_date: string;
  description: string;
  days_to_expiry?: number;
  risk_level?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Priority Renewals — shows contracts that need renewal, ranked by urgency
// ---------------------------------------------------------------------------

function PriorityRenewals({ onSelect }: { onSelect: (c: Contract) => void }) {
  const { data } = useQuery({
    queryKey: ["priority-renewals"],
    queryFn: () => fetchAPI<{ contracts: Contract[]; total: number }>("/api/contracts", { max_days: 90, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.contracts?.length) return null;

  // Sort by priority: highest value × urgency
  const sorted = [...data.contracts].sort((a, b) => {
    const urgencyA = Math.max(1, 91 - (a.days_to_expiry ?? 90));
    const urgencyB = Math.max(1, 91 - (b.days_to_expiry ?? 90));
    return (urgencyB * (b.value || 0)) - (urgencyA * (a.value || 0));
  });

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Priority Renewals</h2>
          <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">{data.total} expiring in 90 days</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Contracts ranked by value × urgency. Click to start renewal.</p>
        <div className="space-y-1.5">
          {sorted.slice(0, 6).map((c, i) => (
            <button
              key={c.contract_number}
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all flex items-center gap-3 group"
              style={{ minHeight: 44 }}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">{c.supplier}</span>
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-400 flex-shrink-0">{formatCurrency(c.value)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{c.department}</span>
                  <span>·</span>
                  <span className={`font-medium ${(c.days_to_expiry ?? 99) <= 7 ? "text-red-600 dark:text-red-400" : (c.days_to_expiry ?? 99) <= 30 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>
                    {c.days_to_expiry === 0 ? "Expires today" : `${c.days_to_expiry}d left`}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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

interface PriceTrendData {
  supplier: string;
  contracts: Array<{
    start_date: string;
    value: number;
    contract_number: string;
    description: string;
  }>;
  total_contracts: number;
  department_average: number | null;
  department: string | null;
  price_change_pct: number;
  first_value: number | null;
  latest_value: number | null;
}


// ---------------------------------------------------------------------------
// Step data
// ---------------------------------------------------------------------------

const WIZARD_STEPS = [
  { num: 1, label: "Select", icon: Search },
  { num: 2, label: "Terms", icon: FileText },
  { num: 3, label: "Compliance", icon: ShieldCheck },
  { num: 4, label: "Cost", icon: DollarSign },
  { num: 5, label: "Summary", icon: ClipboardCheck },
];

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function WizardStepIndicator({
  current,
  onStep,
}: {
  current: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav aria-label="Renewal wizard steps" className="mb-6">
      <ol className="flex items-center justify-between gap-1">
        {WIZARD_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.num === current;
          const isComplete = step.num < current;
          const isClickable = step.num < current;
          return (
            <li key={step.num} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && onStep(step.num)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full justify-center
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : isComplete
                      ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950 cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500`}
                style={{ minHeight: 44 }}
                aria-label={`Step ${step.num}: ${step.label}${isComplete ? " (complete)" : isActive ? " (current)" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? (
                  <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <ArrowRight
                  className={`h-4 w-4 mx-1 shrink-0 ${
                    step.num < current ? "text-green-400 dark:text-green-600" : "text-slate-300 dark:text-slate-600"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RenewPage() {
  const [step, setStep] = useState(1);
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Search contracts (by vendor dropdown or keyword search)
  const activeSearch = vendorFilter || searchQuery;
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["renew-search", vendorFilter, searchQuery],
    queryFn: () =>
      fetchAPI<{ contracts: Contract[]; total: number }>("/api/contracts", {
        search: activeSearch,
        limit: 20,
      }),
    enabled: activeSearch.length >= 2,
  });

  // Parsed contract data
  const { data: parsedData, isLoading: parsedLoading } = useQuery<ParsedContractResponse>({
    queryKey: ["parsed-renew", selectedContract?.contract_number],
    queryFn: () =>
      fetchAPI<ParsedContractResponse>(
        `/api/parser/parse/${encodeURIComponent(selectedContract!.contract_number)}`
      ),
    enabled: Boolean(selectedContract?.contract_number) && step >= 2,
    staleTime: 10 * 60 * 1000,
  });

  // Price trend
  const { data: priceTrend } = useQuery<PriceTrendData>({
    queryKey: ["price-trend-renew", selectedContract?.supplier],
    queryFn: () =>
      fetchAPI<PriceTrendData>(
        `/api/analytics/vendor-price-trend/${encodeURIComponent(selectedContract!.supplier)}`
      ),
    enabled: Boolean(selectedContract?.supplier) && step >= 4,
    staleTime: 5 * 60 * 1000,
  });

  function handleSelectContract(c: Contract) {
    setSelectedContract(c);
    setStep(2);
  }

  function nextStep() {
    setStep((s) => Math.min(5, s + 1));
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  const priceIncreasedOver10 = priceTrend ? priceTrend.price_change_pct > 10 : false;

  // Readiness check
  const issues: string[] = [];
  if (priceIncreasedOver10)
    issues.push(`Price increased ${priceTrend!.price_change_pct}% from first contract`);

  const readyToRenew = issues.length === 0 && selectedContract;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <RefreshCw
            className="h-7 w-7 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          Contract Renewal Wizard
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Step-by-step guided workflow for renewing a contract: review terms,
          verify compliance, check costs, and generate a renewal summary.
        </p>
      </div>

      {/* Step Indicator */}
      <WizardStepIndicator current={step} onStep={setStep} />

      {/* ================================================================== */}
      {/* STEP 1: Select Contract */}
      {/* ================================================================== */}
      {step === 1 && (
        <section aria-label="Step 1: Select Contract" className="space-y-4">
          {/* Priority renewals — contracts expiring soonest by value */}
          <PriorityRenewals onSelect={handleSelectContract} />

          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Or search for a specific contract
              </h2>
              <VendorSelect
                value={vendorFilter}
                onChange={(v) => { setVendorFilter(v); setSearchQuery(""); }}
                label="Filter by Vendor"
                placeholder="Pick a vendor to see their contracts..."
              />
              <div className="relative">
                <label htmlFor="renew-search" className="sr-only">
                  Search by contract number
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="renew-search"
                  type="search"
                  placeholder="Or search by contract number..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setVendorFilter(""); }}
                  className="pl-9 h-12 text-base"
                />
              </div>

              {searchLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Searching...
                </div>
              )}

              {searchData?.contracts && searchData.contracts.length > 0 && (
                <div className="space-y-2" role="listbox" aria-label="Contract search results">
                  {searchData.contracts.map((c) => (
                    <button
                      key={c.contract_number}
                      onClick={() => handleSelectContract(c)}
                      className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ minHeight: 44 }}
                      role="option"
                      aria-selected={false}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                            {c.contract_number}
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {c.supplier}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {c.department}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(c.value)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Exp: {formatDate(c.end_date)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchData?.contracts?.length === 0 && activeSearch.length >= 2 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                  No contracts found matching &quot;{activeSearch}&quot;.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 2: Current Terms */}
      {/* ================================================================== */}
      {step === 2 && selectedContract && (
        <section aria-label="Step 2: Current Terms">
          <div className="space-y-4">
            {/* Basic details */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Contract Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contract #</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{selectedContract.contract_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vendor</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedContract.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Department</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedContract.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Value</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(selectedContract.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Start</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedContract.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Expires</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedContract.end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI-parsed terms */}
            {parsedLoading && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5">
                  <div className="space-y-3" aria-busy="true">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    ))}
                    <p className="text-sm text-slate-400">Parsing contract description...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {parsedData && !parsedData.error && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                    AI-Parsed Renewal Structure
                  </h3>

                  {/* Term flow */}
                  {(parsedData.parsed.original_term || parsedData.parsed.renewal_structure || parsedData.parsed.total_possible_term) && (
                    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 rounded-lg p-4">
                      <div className="flex flex-wrap items-center gap-1" aria-label="Contract term structure">
                        {[
                          { label: "Original term", value: parsedData.parsed.original_term },
                          { label: "Renewals", value: parsedData.parsed.renewal_structure },
                          { label: "Total possible", value: parsedData.parsed.total_possible_term },
                        ]
                          .filter((s) => s.value)
                          .map((s, i, arr) => (
                            <div key={s.label} className="flex items-center gap-1">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">{s.value}</span>
                              </div>
                              {i < arr.length - 1 && (
                                <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-3 shrink-0" aria-hidden="true" />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {parsedData.parsed.scope_summary && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Scope</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parsedData.parsed.scope_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Raw description */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-4 pb-4">
                <details>
                  <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 select-none">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Original description
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-md p-3 border whitespace-pre-wrap">
                    {selectedContract.description || "No description available."}
                  </p>
                </details>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 3: Compliance Check */}
      {/* ================================================================== */}
      {step === 3 && selectedContract && (
        <section aria-label="Step 3: Compliance Check">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Compliance Check — {selectedContract.supplier}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Auto-checks run against 3 federal databases. Complete all 4 manual checks by visiting each link.
              </p>
            </div>
            <ComplianceCheck supplier={selectedContract.supplier} />
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 4: Cost Review */}
      {/* ================================================================== */}
      {step === 4 && selectedContract && (
        <section aria-label="Step 4: Cost Review">
          <div className="space-y-4">
            {priceTrend ? (
              <>
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-5 pb-5 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Price History -- {selectedContract.supplier}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Contracts</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{priceTrend.total_contracts}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">First</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(priceTrend.first_value)}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Latest</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(priceTrend.latest_value)}</p>
                      </div>
                      <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Change</p>
                        <div className="flex items-center justify-center gap-1">
                          {priceTrend.price_change_pct > 0 ? (
                            <TrendingUp className="h-4 w-4 text-red-500" aria-hidden="true" />
                          ) : priceTrend.price_change_pct < 0 ? (
                            <TrendingDown className="h-4 w-4 text-green-500" aria-hidden="true" />
                          ) : (
                            <Minus className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          )}
                          <p className={`text-lg font-bold ${
                            priceTrend.price_change_pct > 0 ? "text-red-600 dark:text-red-400" : priceTrend.price_change_pct < 0 ? "text-green-600 dark:text-green-400" : "text-slate-600"
                          }`}>
                            {priceTrend.price_change_pct > 0 ? "+" : ""}{priceTrend.price_change_pct}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dept average comparison */}
                    {priceTrend.department_average && priceTrend.latest_value && (
                      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Department average: {formatCurrency(priceTrend.department_average)}. This vendor is{" "}
                          {priceTrend.latest_value > priceTrend.department_average
                            ? `${Math.round(((priceTrend.latest_value - priceTrend.department_average) / priceTrend.department_average) * 100)}% above`
                            : `${Math.round(((priceTrend.department_average - priceTrend.latest_value) / priceTrend.department_average) * 100)}% below`}{" "}
                          average.
                        </p>
                      </div>
                    )}

                    {/* Price increase flag */}
                    {priceIncreasedOver10 && (
                      <div className="flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                          Price has increased more than 10% since the first contract.
                          Consider re-bidding or negotiating terms.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-2 py-4 justify-center text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading price history...
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 5: Renewal Summary */}
      {/* ================================================================== */}
      {step === 5 && selectedContract && (
        <section aria-label="Step 5: Renewal Summary">
          <div className="space-y-4">
            {/* Status banner */}
            <Card className={`${readyToRenew ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50" : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50"}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  {readyToRenew ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  )}
                  <div>
                    <h3 className={`text-lg font-bold ${readyToRenew ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                      {readyToRenew ? "Ready to Renew" : "Needs Review"}
                    </h3>
                    {issues.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {issues.map((issue, i) => (
                          <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Minus className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary card */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Renewal Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Contract</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{selectedContract.contract_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Vendor</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedContract.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Value</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(selectedContract.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Compliance</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      See Step 3
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Price Trend</p>
                    <p className={`text-sm font-semibold ${
                      priceTrend && priceTrend.price_change_pct > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    }`}>
                      {priceTrend ? `${priceTrend.price_change_pct > 0 ? "+" : ""}${priceTrend.price_change_pct}%` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Expires</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedContract.end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-11 gap-2"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print Summary
              </Button>
              <Button
                onClick={() => {
                  toast.success("Renewal initiated", {
                    description: `${selectedContract.contract_number} has been flagged for renewal processing.`,
                  });
                }}
                className={`h-11 gap-2 ${readyToRenew ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"} text-white`}
              >
                {readyToRenew ? (
                  <><RefreshCw className="h-4 w-4" aria-hidden="true" />Proceed to Renew</>
                ) : (
                  <><AlertTriangle className="h-4 w-4" aria-hidden="true" />Proceed with Caution</>
                )}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-1.5 pt-2">
              <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                This summary is for informational purposes only. All renewals must follow City of Richmond procurement policies and Virginia Code Section 2.2-4302.2.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      {selectedContract && (
        <nav className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700" aria-label="Wizard navigation">
          <Button variant="outline" onClick={prevStep} disabled={step <= 1} className="h-11 gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          {step < 5 && (
            <Button onClick={nextStep} className="h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              Next
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
