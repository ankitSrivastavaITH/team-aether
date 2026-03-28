"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ExternalLink,
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

interface DebarmentResult {
  supplier: string;
  checked: boolean;
  debarred: boolean;
  matches?: number;
  details: string;
  source: string;
  disclaimer: string;
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

// ---------------------------------------------------------------------------
// Compliance list data
// ---------------------------------------------------------------------------

const COMPLIANCE_LISTS = [
  {
    id: "sam",
    name: "SAM.gov Exclusion Check",
    auto: true,
    url: "https://sam.gov/content/exclusions",
  },
  {
    id: "fcc",
    name: "FCC Covered List",
    auto: false,
    url: "https://www.fcc.gov/supplychain/coveredlist",
  },
  {
    id: "ofac",
    name: "OFAC SDN List",
    auto: false,
    url: "https://sanctionssearch.ofac.treas.gov/",
  },
  {
    id: "csl",
    name: "Consolidated Screening List",
    auto: false,
    url: "https://www.trade.gov/consolidated-screening-list",
  },
  {
    id: "dhs",
    name: "DHS BOD List",
    auto: false,
    url: "https://www.cisa.gov/binding-operational-directives",
  },
  {
    id: "fbi",
    name: "FBI InfraGard",
    auto: false,
    url: "https://www.infragard.org/",
  },
  {
    id: "ftc",
    name: "FTC Enforcement",
    auto: false,
    url: "https://www.ftc.gov/legal-library/browse/cases-proceedings",
  },
];

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
  const [samResult, setSamResult] = useState<DebarmentResult | null>(null);
  const [samLoading, setSamLoading] = useState(false);
  const [checkedLists, setCheckedLists] = useState<Record<string, boolean>>({});
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

  // Auto-run SAM check when we enter compliance step
  const runSamCheck = useCallback(async (supplier: string) => {
    setSamLoading(true);
    try {
      const data = await fetchAPI<DebarmentResult>(
        `/api/contracts/debarment-check/${encodeURIComponent(supplier)}`
      );
      setSamResult(data);
    } catch {
      setSamResult({
        supplier,
        checked: false,
        debarred: false,
        details: "Could not reach debarment check service.",
        source: "SAM.gov",
        disclaimer: "",
      });
    } finally {
      setSamLoading(false);
    }
  }, []);

  function handleSelectContract(c: Contract) {
    setSelectedContract(c);
    setSamResult(null);
    setCheckedLists({});
    setReviewed(false);
    setStep(2);
  }

  function nextStep() {
    if (step === 3 && selectedContract && !samResult) {
      runSamCheck(selectedContract.supplier);
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  function toggleCheck(id: string) {
    setCheckedLists((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Compute compliance count
  const completedChecks =
    (samResult && !samResult.debarred ? 1 : 0) +
    Object.values(checkedLists).filter(Boolean).length;
  const totalChecks = 7;

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
    const debarred = samResult?.debarred || false;
    const checksComplete = completedChecks === totalChecks;

    if (debarred) {
      reasons.push("Vendor has exclusion records on SAM.gov");
      return {
        action: "Escalate",
        color: "text-red-700 dark:text-red-400",
        reasoning: reasons,
      };
    }

    if (rl === "critical") {
      reasons.push(`Contract expires in ${daysLeft} days (critical)`);
    }
    if (priceUp) {
      reasons.push(
        `Price increased ${priceTrend!.price_change_pct}% since first contract`
      );
    }
    if (!checksComplete) {
      reasons.push(`${totalChecks - completedChecks} compliance checks still pending`);
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
    if (!checksComplete) {
      reasons.push("Complete all compliance checks before renewing");
      return {
        action: "Review with Legal",
        color: "text-amber-700 dark:text-amber-400",
        reasoning: reasons,
      };
    }

    reasons.push("All checks passed, risk is acceptable");
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
            {/* Progress */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Compliance Checklist
                  </h3>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {completedChecks} of {totalChecks} complete
                  </span>
                </div>
                <div
                  className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={completedChecks}
                  aria-valuemin={0}
                  aria-valuemax={totalChecks}
                  aria-label={`${completedChecks} of ${totalChecks} compliance checks complete`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      completedChecks === totalChecks
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${(completedChecks / totalChecks) * 100}%`,
                    }}
                  />
                </div>
                {completedChecks === totalChecks && (
                  <p className="mt-2 text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    All 7 checks complete -- vendor cleared for procurement
                  </p>
                )}
              </CardContent>
            </Card>

            {/* SAM.gov auto-check */}
            <Card
              className={`${
                samResult
                  ? samResult.debarred
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-5 text-right">
                      1
                    </span>
                    {samResult ? (
                      samResult.debarred ? (
                        <ShieldAlert
                          className="h-5 w-5 text-red-600 dark:text-red-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <ShieldCheck
                          className="h-5 w-5 text-green-600 dark:text-green-400"
                          aria-hidden="true"
                        />
                      )
                    ) : (
                      <ShieldCheck
                        className="h-5 w-5 text-slate-400"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        SAM.gov Exclusion Check
                      </span>
                      {samResult && (
                        <p
                          className={`text-xs ${
                            samResult.debarred
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {samResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                  {!samResult && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSamCheck(selectedContract.supplier)}
                      disabled={samLoading}
                      className="h-9 gap-1.5"
                    >
                      {samLoading ? (
                        <>
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                          Checking...
                        </>
                      ) : (
                        <>
                          <ShieldCheck
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Auto-Check
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual checks */}
            {COMPLIANCE_LISTS.filter((l) => !l.auto).map((list, idx) => (
              <Card
                key={list.id}
                className={`${
                  checkedLists[list.id]
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-5 text-right">
                        {idx + 2}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!checkedLists[list.id]}
                          onChange={() => toggleCheck(list.id)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500"
                          aria-label={`Mark ${list.name} as verified`}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {list.name}
                        </span>
                      </label>
                    </div>
                    <a
                      href={list.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                      style={{ minHeight: 44 }}
                      aria-label={`Open ${list.name} in a new tab`}
                    >
                      <ExternalLink
                        className="h-3 w-3"
                        aria-hidden="true"
                      />
                      Check
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                      {completedChecks}/{totalChecks}
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
