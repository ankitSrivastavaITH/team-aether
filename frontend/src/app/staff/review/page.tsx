"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShieldCheck,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Printer,
  ArrowRight,
  ArrowLeft,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Info,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { VendorSelect } from "@/components/vendor-select";
import { ComplianceCheck } from "@/components/compliance-check";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
  procurement_type?: string;
  [key: string]: unknown;
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

interface RiskInsight {
  contract_number: string;
  risk_level: string;
  days_to_expiry: number;
  recommendation: string;
  [key: string]: unknown;
}

interface VendorDetailContract {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  start_date: string;
  end_date: string;
  description: string;
  risk_level?: string;
  days_to_expiry?: number;
  [key: string]: unknown;
}

interface VendorDetailResponse {
  supplier: string;
  contracts: VendorDetailContract[];
  count: number;
  total_value: number | null;
  first_contract: string | null;
  last_expiry: string | null;
  departments_served: (string | null)[];
}

interface ComplianceCheckResult {
  checked: boolean;
  debarred?: boolean;
  flagged?: boolean;
  details: string;
}

interface ComplianceCheckResponse {
  supplier: string;
  sam_check: ComplianceCheckResult;
  fcc_check: ComplianceCheckResult;
  csl_check: ComplianceCheckResult;
  federal_lists: string[];
  total_lists: number;
  auto_checked: number;
  manual_review_needed: number;
  any_flagged: boolean;
  recommendation: string;
  virginia_code_reference: string;
  disclaimer: string;
}


// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { num: 1, label: "Select", icon: Search },
  { num: 2, label: "Risk", icon: AlertTriangle },
  { num: 3, label: "Terms", icon: FileText },
  { num: 4, label: "Compliance", icon: ShieldCheck },
  { num: 5, label: "Decision", icon: ClipboardCheck },
];

function StepIndicator({
  current,
  onStep,
}: {
  current: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav aria-label="Review workflow steps" className="mb-8">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
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
                <span className="text-sm font-medium hidden sm:inline">
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  className={`h-4 w-4 mx-1 shrink-0 ${
                    step.num < current
                      ? "text-green-400 dark:text-green-600"
                      : "text-slate-300 dark:text-slate-600"
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
// Price Trend Mini-Chart
// ---------------------------------------------------------------------------

function PriceTrendMiniTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { contract_number: string } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-md text-sm"
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {payload[0].payload.contract_number}
      </p>
    </div>
  );
}

function PriceTrendMini({ data }: { data: PriceTrendData }) {
  if (!data.contracts || data.contracts.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No price history available for this vendor.
      </p>
    );
  }

  const chartData = data.contracts.map((c) => ({
    date: c.start_date?.substring(0, 10) || "",
    value: c.value,
    contract_number: c.contract_number,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {data.price_change_pct !== 0 && (
          <Badge
            className={`gap-1 ${
              data.price_change_pct > 0
                ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                : "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
            }`}
          >
            {data.price_change_pct > 0 ? (
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
            )}
            {data.price_change_pct > 0 ? "+" : ""}
            {data.price_change_pct}% price change
          </Badge>
        )}
        {data.department_average && data.latest_value && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {data.latest_value > data.department_average
              ? `${Math.round(((data.latest_value - data.department_average) / data.department_average) * 100)}% above`
              : `${Math.round(((data.department_average - data.latest_value) / data.department_average) * 100)}% below`}{" "}
            dept avg ({formatCurrency(data.department_average)})
          </span>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-slate-500 dark:text-slate-400"
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`
              }
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
              className="text-slate-500 dark:text-slate-400"
            />
            <Tooltip content={<PriceTrendMiniTooltip />} />
            {data.department_average && (
              <ReferenceLine
                y={data.department_average}
                stroke="#94a3b8"
                strokeDasharray="6 3"
                label={{
                  value: "Dept avg",
                  position: "right",
                  fontSize: 10,
                  fill: "#94a3b8",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ReviewPage() {
  const [step, setStep] = useState(1);
  const [vendorFilter, setVendorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [reviewed, setReviewed] = useState(false);

  // Search contracts (by vendor dropdown or keyword search)
  const activeSearch = vendorFilter || searchQuery;
  const {
    data: searchData,
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ["review-search", vendorFilter, searchQuery],
    queryFn: () =>
      fetchAPI<{ contracts: Contract[]; total: number }>("/api/contracts", {
        search: activeSearch,
        limit: 20,
      }),
    enabled: activeSearch.length >= 2,
  });

  // Parsed contract data (step 3)
  const { data: parsedData, isLoading: parsedLoading } = useQuery<ParsedContractResponse>({
    queryKey: ["parsed-review", selectedContract?.contract_number],
    queryFn: () =>
      fetchAPI<ParsedContractResponse>(
        `/api/parser/parse/${encodeURIComponent(selectedContract!.contract_number)}`
      ),
    enabled: Boolean(selectedContract?.contract_number) && step >= 3,
    staleTime: 10 * 60 * 1000,
  });

  // Price trend (step 2+)
  const { data: priceTrend } = useQuery<PriceTrendData>({
    queryKey: ["price-trend-review", selectedContract?.supplier],
    queryFn: () =>
      fetchAPI<PriceTrendData>(
        `/api/analytics/vendor-price-trend/${encodeURIComponent(selectedContract!.supplier)}`
      ),
    enabled: Boolean(selectedContract?.supplier) && step >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Risk insight
  const { data: riskData } = useQuery<RiskInsight>({
    queryKey: ["risk-insight", selectedContract?.contract_number],
    queryFn: () =>
      fetchAPI<RiskInsight>(
        `/api/contracts/risk-insight/${encodeURIComponent(selectedContract!.contract_number)}`
      ),
    enabled: Boolean(selectedContract?.contract_number) && step >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Vendor detail — fetched immediately when supplier is selected (not step-gated)
  const { data: vendorDetail, isLoading: vendorDetailLoading } = useQuery<VendorDetailResponse>({
    queryKey: ["vendor-detail-review", selectedContract?.supplier],
    queryFn: () =>
      fetchAPI<VendorDetailResponse>(
        `/api/contracts/vendor/${encodeURIComponent(selectedContract!.supplier)}`
      ),
    enabled: Boolean(selectedContract?.supplier),
    staleTime: 5 * 60 * 1000,
  });

  // Compliance check — fetched immediately when supplier is selected (not step-gated)
  const { data: complianceData, isLoading: complianceLoading } = useQuery<ComplianceCheckResponse>({
    queryKey: ["compliance-check-review", selectedContract?.supplier],
    queryFn: () =>
      fetchAPI<ComplianceCheckResponse>(
        `/api/contracts/compliance-check/${encodeURIComponent(selectedContract!.supplier)}`
      ),
    enabled: Boolean(selectedContract?.supplier),
    staleTime: 5 * 60 * 1000,
  });

  function handleSelectContract(c: Contract) {
    setSelectedContract(c);
    setReviewed(false);
    setStep(2);
  }

  function nextStep() {
    setStep((s) => Math.min(5, s + 1));
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  // Risk styling
  function riskStyle(level: string) {
    switch (level) {
      case "critical":
        return {
          bg: "bg-red-50 dark:bg-red-950/50",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-800 dark:text-red-300",
          badge: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
        };
      case "warning":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/50",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-800 dark:text-amber-300",
          badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
        };
      default:
        return {
          bg: "bg-green-50 dark:bg-green-950/50",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-800 dark:text-green-300",
          badge: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
        };
    }
  }

  // Decision logic
  function computeDecision(): {
    action: string;
    color: string;
    reasoning: string[];
  } {
    const reasons: string[] = [];
    const rl = selectedContract?.risk_level || riskData?.risk_level || "ok";
    const daysLeft =
      selectedContract?.days_to_expiry ?? riskData?.days_to_expiry ?? 999;
    const priceUp = priceTrend ? priceTrend.price_change_pct > 10 : false;

    if (rl === "critical") {
      reasons.push(`Contract expires in ${daysLeft} days (critical)`);
    }
    if (priceUp) {
      reasons.push(
        `Price increased ${priceTrend!.price_change_pct}% since first contract`
      );
    }

    if (rl === "critical" && priceUp) {
      reasons.push("Recommend re-bidding due to both expiry risk and price increase");
      return { action: "Rebid", color: "text-orange-700 dark:text-orange-400", reasoning: reasons };
    }
    if (rl === "critical" || (rl === "warning" && priceUp)) {
      reasons.push("Legal review recommended before proceeding");
      return {
        action: "Review with Legal",
        color: "text-amber-700 dark:text-amber-400",
        reasoning: reasons,
      };
    }

    reasons.push("Risk is acceptable — verify compliance step before proceeding");
    if (daysLeft < 90) reasons.push("Initiate renewal process promptly");
    return { action: "Renew", color: "text-green-700 dark:text-green-400", reasoning: reasons };
  }

  function handlePrint() {
    window.print();
  }

  function handleMarkReviewed() {
    setReviewed(true);
    toast.success("Contract marked as reviewed", {
      description: `${selectedContract?.contract_number} has been flagged for the record.`,
    });
  }

  const decision = selectedContract ? computeDecision() : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <ClipboardCheck
            className="h-7 w-7 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          Procurement Review
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Unified workflow: select a contract, assess risk, review terms, verify
          compliance, and make a decision -- all in one place.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} onStep={setStep} />

      {/* ================================================================== */}
      {/* STEP 1: Select Contract */}
      {/* ================================================================== */}
      {step === 1 && (
        <section aria-label="Step 1: Select a contract">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Search for a contract
              </h2>
              <VendorSelect
                value={vendorFilter}
                onChange={(v) => { setVendorFilter(v); setSearchQuery(""); }}
                label="Filter by Vendor"
                placeholder="Pick a vendor to see their contracts..."
              />
              <div className="relative">
                <label htmlFor="review-search" className="sr-only">
                  Search by contract number or keyword
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="review-search"
                  type="search"
                  placeholder="Or search by contract number or keyword..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setVendorFilter(""); }}
                  className="pl-9 h-12 text-base"
                />
              </div>

              {searchLoading && (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Searching contracts...
                </div>
              )}

              {searchData?.contracts && searchData.contracts.length > 0 && (
                <div className="space-y-2" role="listbox" aria-label="Search results">
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
                            {c.department} -- {c.description}
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
      {/* STEP 2: Risk Assessment */}
      {/* ================================================================== */}
      {step === 2 && selectedContract && (
        <section aria-label="Step 2: Risk Assessment">
          <div className="space-y-4">
            {/* Contract header */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
                      {selectedContract.contract_number}
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedContract.supplier}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {selectedContract.department} | {formatCurrency(selectedContract.value)}
                    </p>
                  </div>
                  {(() => {
                    const rl =
                      selectedContract.risk_level ||
                      riskData?.risk_level ||
                      "unknown";
                    const rs = riskStyle(rl);
                    return (
                      <Badge className={`${rs.badge} text-sm px-3 py-1`}>
                        {rl === "critical"
                          ? "Critical Risk"
                          : rl === "warning"
                          ? "Warning"
                          : "OK"}
                      </Badge>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Risk details */}
            {(() => {
              const rl =
                selectedContract.risk_level ||
                riskData?.risk_level ||
                "ok";
              const daysLeft =
                selectedContract.days_to_expiry ??
                riskData?.days_to_expiry ??
                null;
              const rs = riskStyle(rl);
              return (
                <Card className={`${rs.bg} ${rs.border}`}>
                  <CardContent className="pt-5 pb-5 space-y-4">
                    <div className="flex items-center gap-3">
                      {rl === "critical" ? (
                        <AlertTriangle
                          className="h-6 w-6 text-red-600 dark:text-red-400"
                          aria-hidden="true"
                        />
                      ) : rl === "warning" ? (
                        <Clock
                          className="h-6 w-6 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle
                          className="h-6 w-6 text-green-600 dark:text-green-400"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <h3 className={`font-semibold ${rs.text}`}>
                          {rl === "critical"
                            ? "Critical -- Immediate Action Required"
                            : rl === "warning"
                            ? "Warning -- Review Needed Soon"
                            : "Low Risk -- Contract in Good Standing"}
                        </h3>
                        {daysLeft !== null && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {daysLeft > 0
                              ? `${daysLeft} days until expiry`
                              : daysLeft === 0
                              ? "Expires today"
                              : `Expired ${Math.abs(daysLeft)} days ago`}
                          </p>
                        )}
                      </div>
                    </div>
                    {riskData?.recommendation && (
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">AI Recommendation: </span>
                          {riskData.recommendation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Auto-populated vendor intelligence */}
            {vendorDetailLoading && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5">
                  <div className="space-y-3" aria-busy="true">
                    <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="grid grid-cols-3 gap-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                      ))}
                    </div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      Loading vendor intelligence...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {vendorDetail && (
              <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    Vendor Intelligence (Auto-populated)
                  </h3>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Contracts</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{vendorDetail.count}</p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {vendorDetail.total_value ? formatCurrency(vendorDetail.total_value) : "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">First Contract</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {vendorDetail.first_contract ? formatDate(vendorDetail.first_contract) : "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Last Expiry</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {vendorDetail.last_expiry ? formatDate(vendorDetail.last_expiry) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Departments served */}
                  {vendorDetail.departments_served.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                        Departments Served
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vendorDetail.departments_served
                          .filter((d): d is string => d !== null)
                          .map((dept) => (
                            <Badge
                              key={dept}
                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 text-xs"
                            >
                              {dept}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Risk distribution across vendor's contracts */}
                  {vendorDetail.contracts.length > 0 && (() => {
                    const riskCounts: Record<string, number> = {};
                    vendorDetail.contracts.forEach((c) => {
                      const level = c.risk_level || "unknown";
                      riskCounts[level] = (riskCounts[level] || 0) + 1;
                    });
                    return (
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                          Risk Distribution
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(riskCounts).map(([level, count]) => {
                            const colors =
                              level === "critical"
                                ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                                : level === "warning"
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                                : level === "expired"
                                ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                                : "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
                            return (
                              <Badge key={level} className={`${colors} text-xs gap-1`}>
                                {level}: {count}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* AI summary line */}
                  {riskData?.recommendation && (
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-blue-700 dark:text-blue-400">AI Summary: </span>
                        {vendorDetail.count} contracts totaling{" "}
                        {vendorDetail.total_value ? formatCurrency(vendorDetail.total_value) : "$0"} across{" "}
                        {vendorDetail.departments_served.filter(Boolean).length} department(s).{" "}
                        {riskData.recommendation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Price context */}
            {priceTrend && priceTrend.total_contracts > 0 && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    Vendor Price History ({priceTrend.total_contracts} contracts)
                  </h3>
                  <PriceTrendMini data={priceTrend} />
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 3: Contract Terms */}
      {/* ================================================================== */}
      {step === 3 && selectedContract && (
        <section aria-label="Step 3: Contract Terms">
          <div className="space-y-4">
            {parsedLoading && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6">
                  <div className="space-y-3" aria-busy="true">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"
                      />
                    ))}
                    <p className="text-sm text-slate-400">
                      AI is extracting structured fields from the contract...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {parsedData && !parsedData.error && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    AI-Parsed Contract Terms
                  </h3>

                  {/* Badges row */}
                  {(parsedData.parsed.solicitation_number ||
                    parsedData.parsed.procurement_method) && (
                    <div className="flex flex-wrap gap-2">
                      {parsedData.parsed.solicitation_number && (
                        <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                          {parsedData.parsed.solicitation_number}
                        </Badge>
                      )}
                      {parsedData.parsed.procurement_method && (
                        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                          {parsedData.parsed.procurement_method}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Scope */}
                  {parsedData.parsed.scope_summary && (
                    <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 rounded-lg p-4">
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                        Scope
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {parsedData.parsed.scope_summary}
                      </p>
                    </div>
                  )}

                  {/* Term flow */}
                  {(parsedData.parsed.original_term ||
                    parsedData.parsed.renewal_structure ||
                    parsedData.parsed.total_possible_term) && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        Contract Duration
                      </p>
                      <div
                        className="flex flex-wrap items-center gap-1"
                        aria-label="Contract term structure"
                      >
                        {[
                          {
                            label: "Original term",
                            value: parsedData.parsed.original_term,
                          },
                          {
                            label: "Renewals",
                            value: parsedData.parsed.renewal_structure,
                          },
                          {
                            label: "Total possible",
                            value: parsedData.parsed.total_possible_term,
                          },
                        ]
                          .filter((s) => s.value)
                          .map((s, i, arr) => (
                            <div key={s.label} className="flex items-center gap-1">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  {s.label}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {s.value}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <ArrowRight
                                  className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-3 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Key details */}
                  {parsedData.parsed.key_details &&
                    parsedData.parsed.key_details.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                          Key Details
                        </p>
                        <ul className="space-y-1.5" aria-label="Key contract details">
                          {parsedData.parsed.key_details.map((d, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                            >
                              <span
                                className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 dark:bg-violet-500 shrink-0"
                                aria-hidden="true"
                              />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Original description */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-5">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 select-none font-medium">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    View original contract description
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-md p-3 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                    {selectedContract.description || "No description available."}
                  </p>
                </details>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 4: Compliance Verification */}
      {/* ================================================================== */}
      {step === 4 && selectedContract && (
        <section aria-label="Step 4: Compliance Verification">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Compliance Verification
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Auto-checks run against 3 federal databases. Complete all 4 manual checks by visiting each link.
              </p>
            </div>

            {/* Auto-populated compliance results (pre-fetched) */}
            {complianceLoading && (
              <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="pt-5 pb-5">
                  <div className="space-y-3" aria-busy="true">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Checking federal compliance databases...
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {complianceData && (
              <>
                {/* Flagged warning banner */}
                {complianceData.any_flagged && (
                  <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-semibold text-red-800 dark:text-red-300">
                            Compliance Flag Detected
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            This vendor was flagged on one or more federal exclusion lists. Review required before procurement.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Auto-check results summary */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-500" aria-hidden="true" />
                      Automated Screening Results (Pre-fetched)
                    </h4>
                    <div className="grid gap-2">
                      {/* SAM.gov */}
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        complianceData.sam_check.debarred
                          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                          : complianceData.sam_check.checked
                          ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}>
                        {complianceData.sam_check.debarred ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
                        ) : complianceData.sam_check.checked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <Clock className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">SAM.gov Exclusions</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{complianceData.sam_check.details}</p>
                        </div>
                        <Badge className={`shrink-0 text-xs ${
                          complianceData.sam_check.debarred
                            ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                            : complianceData.sam_check.checked
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {complianceData.sam_check.debarred ? "FLAGGED" : complianceData.sam_check.checked ? "CLEAR" : "N/A"}
                        </Badge>
                      </div>

                      {/* FCC Covered List */}
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        complianceData.fcc_check.flagged
                          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                          : complianceData.fcc_check.checked
                          ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}>
                        {complianceData.fcc_check.flagged ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
                        ) : complianceData.fcc_check.checked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <Clock className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">FCC Covered List</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{complianceData.fcc_check.details}</p>
                        </div>
                        <Badge className={`shrink-0 text-xs ${
                          complianceData.fcc_check.flagged
                            ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                            : complianceData.fcc_check.checked
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {complianceData.fcc_check.flagged ? "FLAGGED" : complianceData.fcc_check.checked ? "CLEAR" : "N/A"}
                        </Badge>
                      </div>

                      {/* Consolidated Screening List */}
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        complianceData.csl_check.flagged
                          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
                          : complianceData.csl_check.checked
                          ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}>
                        {complianceData.csl_check.flagged ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
                        ) : complianceData.csl_check.checked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                        ) : (
                          <Clock className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Consolidated Screening List</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{complianceData.csl_check.details}</p>
                        </div>
                        <Badge className={`shrink-0 text-xs ${
                          complianceData.csl_check.flagged
                            ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                            : complianceData.csl_check.checked
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {complianceData.csl_check.flagged ? "FLAGGED" : complianceData.csl_check.checked ? "CLEAR" : "N/A"}
                        </Badge>
                      </div>
                    </div>

                    {/* Summary line */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      {complianceData.auto_checked} of {complianceData.total_lists} federal lists checked automatically.{" "}
                      {complianceData.manual_review_needed} require manual verification below.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <ComplianceCheck supplier={selectedContract.supplier} />
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* STEP 5: Decision & Action */}
      {/* ================================================================== */}
      {step === 5 && selectedContract && decision && (
        <section aria-label="Step 5: Decision and Action">
          <div className="space-y-4">
            {/* Summary card */}
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <CardContent className="pt-6 space-y-5">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-1">
                    AI Recommendation
                  </p>
                  <p className={`text-3xl font-bold ${decision.color}`}>
                    {decision.action}
                  </p>
                </div>

                {/* Contract summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Contract
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {selectedContract.contract_number}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Value
                    </p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedContract.value)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Risk
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {selectedContract.risk_level ||
                        riskData?.risk_level ||
                        "OK"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Compliance
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Step 4
                    </p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                    Reasoning
                  </p>
                  <ul className="space-y-1.5">
                    {decision.reasoning.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Minus
                          className="h-4 w-4 text-slate-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price change summary */}
                {priceTrend && priceTrend.price_change_pct !== 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    {priceTrend.price_change_pct > 0 ? (
                      <TrendingUp
                        className="h-4 w-4 text-red-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <TrendingDown
                        className="h-4 w-4 text-green-500"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-slate-600 dark:text-slate-400">
                      Price trend: {priceTrend.price_change_pct > 0 ? "+" : ""}
                      {priceTrend.price_change_pct}% over{" "}
                      {priceTrend.total_contracts} contracts
                    </span>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="flex items-start gap-1.5">
                  <Info
                    className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    This recommendation is AI-generated for informational
                    purposes only. All procurement decisions must follow City of
                    Richmond procurement policies and Virginia Code requirements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-11 gap-2"
                aria-label="Print or export review summary as PDF"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Export as PDF
              </Button>
              <Button
                onClick={handleMarkReviewed}
                disabled={reviewed}
                className={`h-11 gap-2 ${
                  reviewed
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                aria-label="Mark this contract as reviewed"
              >
                {reviewed ? (
                  <>
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Reviewed
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    Mark as Reviewed
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* Navigation Buttons */}
      {/* ================================================================== */}
      {selectedContract && (
        <nav
          className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700"
          aria-label="Step navigation"
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step <= 1}
            className="h-11 gap-2"
            aria-label="Go to previous step"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          {step < 5 && (
            <Button
              onClick={nextStep}
              className="h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Go to next step"
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
