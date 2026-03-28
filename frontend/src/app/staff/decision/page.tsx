"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI, API_BASE } from "@/lib/api";
import { formatCurrency, formatDate, riskColor } from "@/lib/utils";
import { VendorSelect } from "@/components/vendor-select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import {
  Brain,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Printer,
  Info,
  Shield,
  TrendingUp,
  FileSearch,
  Scale,
  ScrollText,
  CircleDot,
  Users,
  RefreshCw,
  GitCompare,
  ClipboardCheck,
  ShieldCheck,
  Database,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  XCircle,
  FileText,
  Building2,
  Globe,
} from "lucide-react";

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

interface VendorDetailResponse {
  supplier: string;
  contracts: Contract[];
  count: number;
  total_value: number | null;
  first_contract: string | null;
  last_expiry: string | null;
  departments_served: (string | null)[];
}

interface EvidenceItem {
  point: string;
  evidence: string;
  source: string;
}

interface DepartmentVendor {
  supplier: string;
  count: number;
  total_value: number;
}

interface DepartmentDetailResponse {
  department: string;
  contracts: Contract[];
  stats: Record<string, number>;
  top_vendors: DepartmentVendor[];
  risk_breakdown: { risk_level: string; count: number }[];
  yearly_spending: { year: number; count: number; total_value: number }[];
}

interface DataCollected {
  contract: {
    number: string;
    value: number | null;
    department: string | null;
    days_to_expiry: number | null;
    risk_level: string | null;
  };
  vendor: {
    total_contracts: number;
    total_value: number;
    departments_served: string[];
  };
  compliance: {
    sam_clear: boolean;
    fcc_clear: boolean;
    csl_clear: boolean;
    any_flagged: boolean;
  };
  price_trend: {
    data_points: number;
    values: (number | null)[];
    trend: string;
  };
  concentration: {
    vendor_rank: number | null;
    vendor_share_in_dept: number;
    total_vendors_in_dept: number;
  };
  pdf_intel: string;
}

interface ConfidenceFactor {
  factor: string;
  impact: string;
  detail: string;
}

interface SimilarContract {
  contract_number: string;
  supplier: string;
  value: number;
  risk_level: string;
  days_to_expiry: number;
}

interface DecisionResult {
  verdict: "RENEW" | "REBID" | "ESCALATE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  pros: EvidenceItem[];
  cons: EvidenceItem[];
  memo: string;
  contract_number: string;
  supplier: string;
  contract_value: number;
  department: string;
  data_collected?: DataCollected;
  confidence_factors?: ConfidenceFactor[];
  similar_contracts?: SimilarContract[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  RENEW: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  REBID: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  ESCALATE: {
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-500/30",
    glow: "shadow-red-500/20",
  },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  HIGH: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  MEDIUM: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  LOW: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
};

const ANALYSIS_STEPS = [
  { label: "Checking vendor history...", icon: FileSearch },
  { label: "Running compliance checks...", icon: Shield },
  { label: "Analyzing price trends...", icon: TrendingUp },
  { label: "Evaluating concentration risk...", icon: CircleDot },
  { label: "Parsing contract terms...", icon: ScrollText },
  { label: "Generating recommendation...", icon: Scale },
];

// ---------------------------------------------------------------------------
// Loading Animation
// ---------------------------------------------------------------------------

function AnalysisLoader() {
  const [completed, setCompleted] = useState<boolean[]>(
    new Array(ANALYSIS_STEPS.length).fill(false)
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCompleted((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 800 + i * 900)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="p-8 md:p-12">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <Loader2
            className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20" />
        </div>
        <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Analyzing contract...
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Our AI is running a comprehensive multi-factor analysis
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto"
        role="status"
        aria-label="Analysis progress"
      >
        {ANALYSIS_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-500 ${
                completed[i]
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              }`}
            >
              {completed[i] ? (
                <CheckCircle
                  className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-in fade-in zoom-in duration-300"
                  aria-hidden="true"
                />
              ) : (
                <Icon
                  className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 animate-pulse"
                  aria-hidden="true"
                />
              )}
              <span
                className={`text-sm transition-colors duration-300 ${
                  completed[i]
                    ? "text-emerald-800 dark:text-emerald-300 font-medium"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Contract Selection Cards
// ---------------------------------------------------------------------------

function ContractCard({
  contract,
  selected,
  onSelect,
}: {
  contract: Contract;
  selected: boolean;
  onSelect: () => void;
}) {
  const risk = contract.risk_level || "unknown";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        selected
          ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 shadow-md shadow-blue-500/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
      }`}
      aria-label={`Contract ${contract.contract_number}, ${formatCurrency(contract.value)}, ${risk} risk`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {contract.contract_number}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {contract.department || "No department"}
          </p>
        </div>
        <Badge className={`shrink-0 ${riskColor(risk)}`}>
          {risk}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(contract.value)}
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          {formatDate(contract.start_date)} &mdash; {formatDate(contract.end_date)}
        </span>
      </div>

      {contract.description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {contract.description}
        </p>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layer 1: Traffic Light Verdict
// ---------------------------------------------------------------------------

function VerdictSection({ result }: { result: DecisionResult }) {
  const vs = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.REBID;
  const cs = CONFIDENCE_STYLES[result.confidence] || CONFIDENCE_STYLES.MEDIUM;

  return (
    <Card className="overflow-hidden">
      {/* Gradient accent bar */}
      <div
        className={`h-1.5 w-full ${
          result.verdict === "RENEW"
            ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
            : result.verdict === "REBID"
            ? "bg-gradient-to-r from-amber-400 to-amber-600"
            : "bg-gradient-to-r from-red-400 to-red-600"
        }`}
        aria-hidden="true"
      />

      <div className="p-6 md:p-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            AI Recommendation
          </span>
        </div>

        {/* Verdict badge */}
        <div
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 ${vs.bg} ${vs.border} ${vs.glow} shadow-lg mb-5`}
          role="status"
          aria-label={`Verdict: ${result.verdict}`}
        >
          <span className={`text-4xl md:text-5xl font-extrabold tracking-tight ${vs.text}`}>
            {result.verdict}
          </span>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Badge className={`text-xs font-semibold border px-3 py-1 ${cs}`}>
            {result.confidence} CONFIDENCE
          </Badge>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {result.contract_number} &middot; {formatCurrency(result.contract_value)}
          </span>
        </div>

        {/* Summary */}
        <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {result.summary}
        </p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Layer 2: Evidence Grid
// ---------------------------------------------------------------------------

function EvidenceGrid({ pros, cons }: { pros: EvidenceItem[]; cons: EvidenceItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Pros column */}
      <Card className="border-emerald-200/60 dark:border-emerald-800/40">
        <CardContent className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
              Reasons to Renew
            </h3>
          </div>
          <div className="space-y-4" role="list" aria-label="Reasons to renew">
            {pros.map((item, i) => (
              <div
                key={i}
                className="pl-4 border-l-2 border-emerald-300 dark:border-emerald-700"
                role="listitem"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {item.point}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {item.evidence}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500"
                >
                  {item.source}
                </Badge>
              </div>
            ))}
            {pros.length === 0 && (
              <p className="text-sm text-slate-400 italic">No supporting evidence found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cons column */}
      <Card className="border-red-200/60 dark:border-red-800/40">
        <CardContent className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle
              className="h-5 w-5 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Reasons to Rebid
            </h3>
          </div>
          <div className="space-y-4" role="list" aria-label="Reasons to rebid">
            {cons.map((item, i) => (
              <div
                key={i}
                className="pl-4 border-l-2 border-red-300 dark:border-red-700"
                role="listitem"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {item.point}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {item.evidence}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500"
                >
                  {item.source}
                </Badge>
              </div>
            ))}
            {cons.length === 0 && (
              <p className="text-sm text-slate-400 italic">No concerns identified.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data Analyzed Section
// ---------------------------------------------------------------------------

function DataAnalyzedSection({ data }: { data: DataCollected }) {
  const complianceIcon = (clear: boolean) =>
    clear ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
    );

  const trendIcon =
    data.price_trend.trend === "increasing" ? (
      <ArrowUpRight className="h-4 w-4 text-red-500" aria-hidden="true" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-emerald-500" aria-hidden="true" />
    );

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Database
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Data Analyzed
          </h3>
          <Badge variant="outline" className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            What the AI saw
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Contract */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Contract
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Value</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.contract.value ? formatCurrency(data.contract.value) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Department</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right truncate max-w-[120px]">
                  {data.contract.department || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Days Left</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.contract.days_to_expiry ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Risk</span>
                <Badge className={`text-[10px] ${riskColor(data.contract.risk_level || "unknown")}`}>
                  {data.contract.risk_level || "unknown"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Vendor
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Contracts</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.vendor.total_contracts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Value</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(data.vendor.total_value)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400">Depts</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right max-w-[140px] truncate">
                  {data.vendor.departments_served.length > 0
                    ? data.vendor.departments_served.slice(0, 3).join(", ")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Compliance
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">SAM.gov</span>
                <div className="flex items-center gap-1.5">
                  {complianceIcon(data.compliance.sam_clear)}
                  <span className={`font-medium ${data.compliance.sam_clear ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {data.compliance.sam_clear ? "Clear" : "Flagged"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">FCC</span>
                <div className="flex items-center gap-1.5">
                  {complianceIcon(data.compliance.fcc_clear)}
                  <span className={`font-medium ${data.compliance.fcc_clear ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {data.compliance.fcc_clear ? "Clear" : "Flagged"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">CSL</span>
                <div className="flex items-center gap-1.5">
                  {complianceIcon(data.compliance.csl_clear)}
                  <span className={`font-medium ${data.compliance.csl_clear ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {data.compliance.csl_clear ? "Clear" : "Flagged"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Trend */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Price Trend
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Direction</span>
                <div className="flex items-center gap-1.5">
                  {trendIcon}
                  <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                    {data.price_trend.trend.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Data Points</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.price_trend.data_points}
                </span>
              </div>
            </div>
          </div>

          {/* Concentration */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Concentration
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rank in Dept</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.concentration.vendor_rank ? `#${data.concentration.vendor_rank}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Dept Share</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(data.concentration.vendor_share_in_dept)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Vendors</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {data.concentration.total_vendors_in_dept}
                </span>
              </div>
            </div>
          </div>

          {/* PDF Contract Terms (OCR) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              PDF Contract Terms (OCR)
            </p>
            <div className="flex items-center gap-2 text-sm">
              {data.pdf_intel === "found" ? (
                <>
                  <FileText className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Contract terms extracted from PDF
                  </span>
                  <span className="text-xs text-slate-400">(renewal clauses, pricing, expiration)</span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span className="font-medium text-slate-400 dark:text-slate-500">
                    No PDF uploaded for this contract
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Confidence Breakdown Section
// ---------------------------------------------------------------------------

function ConfidenceBreakdown({ factors }: { factors: ConfidenceFactor[] }) {
  if (factors.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Confidence Breakdown
          </h3>
          <Badge variant="outline" className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            How confidence was computed
          </Badge>
        </div>

        <div className="space-y-2" role="list" aria-label="Confidence factors">
          {factors.map((f, i) => {
            const isPositive = f.impact.startsWith("+");
            return (
              <div
                key={i}
                role="listitem"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
              >
                {/* Impact badge */}
                <Badge
                  className={`shrink-0 text-xs font-bold min-w-[48px] justify-center ${
                    isPositive
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                      : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                  }`}
                >
                  {f.impact}
                </Badge>

                {/* Factor name + detail */}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {f.factor}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {f.detail}
                  </p>
                </div>

                {/* Icon */}
                {isPositive ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Similar Contracts Section
// ---------------------------------------------------------------------------

function SimilarContractsSection({ contracts }: { contracts: SimilarContract[] }) {
  if (contracts.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Building2
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Similar Contracts
          </h3>
          <Badge variant="outline" className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            Same department, similar value
          </Badge>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          role="list"
          aria-label="Similar contracts"
        >
          {contracts.map((c) => (
            <div
              key={c.contract_number}
              role="listitem"
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                    {c.supplier}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    #{c.contract_number}
                  </p>
                </div>
                {c.risk_level && (
                  <Badge className={`shrink-0 text-[10px] ${riskColor(c.risk_level)}`}>
                    {c.risk_level}
                  </Badge>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(c.value)}
                </span>
                {c.days_to_expiry != null && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {c.days_to_expiry}d left
                  </span>
                )}
              </div>
              <Link
                href={`/staff/decision?supplier=${encodeURIComponent(c.supplier)}&contract=${encodeURIComponent(c.contract_number)}`}
                className="mt-2.5 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                aria-label={`Compare with contract ${c.contract_number}`}
              >
                Compare with this contract &rarr;
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Equity & Supplier Diversity Consideration
// ---------------------------------------------------------------------------

function EquityConsideration({
  department,
}: {
  department: string;
}) {
  const { data: mbeData } = useQuery<{
    department_diversity: { department: string; unique_vendors: number; total_contracts: number; diversity_ratio: number }[];
    small_business_contracts: { count: number; total_value: number };
    all_contracts: { count: number; total_value: number };
  }>({
    queryKey: ["decision-mbe", department],
    queryFn: () => fetchAPI("/api/mbe/analysis"),
    staleTime: 5 * 60 * 1000,
  });

  if (!mbeData) return null;

  const deptDiversity = mbeData.department_diversity?.find(
    (d) => d.department?.toLowerCase() === department?.toLowerCase()
  );
  const diversityRatio = deptDiversity?.diversity_ratio ?? 0;
  const uniqueVendors = deptDiversity?.unique_vendors ?? 0;
  const totalContracts = deptDiversity?.total_contracts ?? 0;
  const sbPct = mbeData.all_contracts.count
    ? ((mbeData.small_business_contracts.count / mbeData.all_contracts.count) * 100).toFixed(1)
    : "0";

  const diversityLevel =
    diversityRatio >= 0.7
      ? { label: "Strong", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/40" }
      : diversityRatio >= 0.4
      ? { label: "Moderate", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/40" }
      : { label: "Low", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/40" };

  return (
    <Card className="border-purple-200/60 dark:border-purple-800/40">
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Users
            className="h-5 w-5 text-purple-600 dark:text-purple-400"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Equity & Supplier Diversity
          </h3>
          <Badge className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 ml-auto">
            MBE Context
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Department Diversity */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Dept Vendor Diversity
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${diversityLevel.color}`}>
                {(diversityRatio * 100).toFixed(0)}%
              </span>
              <Badge className={`text-[10px] ${diversityLevel.bg} ${diversityLevel.color} border-0`}>
                {diversityLevel.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {uniqueVendors} unique vendors across {totalContracts} contracts
            </p>
          </div>

          {/* Small Business Participation */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Small Business Share
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {sbPct}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mbeData.small_business_contracts.count} of {mbeData.all_contracts.count} contracts
            </p>
          </div>

          {/* Equity Consideration */}
          <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-3">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              Equity Note
            </p>
            <p className="text-sm text-purple-900 dark:text-purple-200">
              {diversityRatio < 0.4
                ? `${department} has low vendor diversity. Consider MBE/small business vendors when rebidding.`
                : diversityRatio < 0.7
                ? `${department} has moderate diversity. Review if alternative MBE vendors are available.`
                : `${department} shows strong vendor diversity — a positive equity indicator.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Alternative Vendors
// ---------------------------------------------------------------------------

function AlternativeVendors({
  department,
  currentSupplier,
}: {
  department: string;
  currentSupplier: string;
}) {
  const { data: deptData } = useQuery<DepartmentDetailResponse>({
    queryKey: ["decision-alt-vendors", department],
    queryFn: () =>
      fetchAPI<DepartmentDetailResponse>(
        `/api/contracts/departments/${encodeURIComponent(department)}`
      ),
    enabled: !!department,
    staleTime: 5 * 60 * 1000,
  });

  const alternatives = (deptData?.top_vendors ?? [])
    .filter((v) => v.supplier !== currentSupplier)
    .sort((a, b) => (b.total_value ?? 0) - (a.total_value ?? 0))
    .slice(0, 6);

  if (alternatives.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Users
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Alternative Vendors in {department}
          </h3>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="list"
          aria-label={`Alternative vendors in ${department}`}
        >
          {alternatives.map((vendor) => (
            <div
              key={vendor.supplier}
              role="listitem"
              className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {vendor.supplier}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {vendor.count} contract{vendor.count !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(vendor.total_value)}
                  </span>
                </div>
              </div>
              <Link
                href="/staff/cost-analysis"
                className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                aria-label={`Compare ${vendor.supplier} in cost analysis`}
              >
                Compare &rarr;
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Layer 3: Decision Memo
// ---------------------------------------------------------------------------

function DecisionMemo({ memo }: { memo: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = memo;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [memo]);

  return (
    <Card>
      <CardContent className="pt-2">
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-1"
          aria-expanded={expanded}
          aria-controls="decision-memo-content"
        >
          <div className="flex items-center gap-2">
            <ScrollText
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              View Full Decision Memo
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
          )}
        </button>

        {expanded && (
          <div id="decision-memo-content" className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* AI disclaimer banner */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                AI-generated draft &mdash; requires staff review before submission
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
                aria-label={copied ? "Copied to clipboard" : "Copy memo to clipboard"}
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
                aria-label="Print decision memo"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print
              </Button>
            </div>

            {/* Markdown content */}
            <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-slate-900 dark:prose-strong:text-slate-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{memo}</ReactMarkdown>
            </article>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Suggested Contracts (shown when no vendor selected)
// ---------------------------------------------------------------------------

interface SuggestedContract {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  days_to_expiry: number;
  risk_level: string;
}

interface PrecomputedDecision {
  contract_number: string;
  supplier: string;
  verdict: string;
  confidence: string;
  summary: string;
  created_at: string;
}

const VERDICT_BADGE_STYLES: Record<string, string> = {
  RENEW: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  REBID: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  ESCALATE: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
};

function SuggestedContracts({ onSelect }: { onSelect: (supplier: string, contract: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["suggested-decisions"],
    queryFn: () => fetchAPI<{ contracts: SuggestedContract[] }>("/api/contracts", { max_days: 90, limit: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: precomputed } = useQuery({
    queryKey: ["precomputed-decisions"],
    queryFn: () => fetchAPI<{ decisions: PrecomputedDecision[]; total: number }>("/api/decision/precomputed"),
    staleTime: 2 * 60 * 1000,
  });

  // Build a lookup map: contract_number -> precomputed decision
  const precomputedMap = new Map<string, PrecomputedDecision>();
  for (const d of precomputed?.decisions ?? []) {
    if (!precomputedMap.has(d.contract_number)) {
      precomputedMap.set(d.contract_number, d);
    }
  }

  const contracts = (data?.contracts ?? []).sort(
    (a, b) => (a.days_to_expiry ?? 999) - (b.days_to_expiry ?? 999)
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading suggestions...</p>
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  if (contracts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Suggested — contracts needing decisions soonest
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Click to analyze with AI</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contracts.map((c) => {
          const isRed = c.risk_level === "critical";
          const isAmber = c.risk_level === "warning";
          const cached = precomputedMap.get(c.contract_number);
          return (
            <button
              key={c.contract_number}
              onClick={() => onSelect(c.supplier, c.contract_number)}
              className={`text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group ${
                isRed
                  ? "border-red-200 dark:border-red-800 hover:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                  : isAmber
                  ? "border-amber-200 dark:border-amber-800 hover:border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
              }`}
              style={{ minHeight: 44 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.department} · #{c.contract_number}</p>
                </div>
                <Badge className={`shrink-0 text-[10px] ${
                  isRed ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                  : isAmber ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                  : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                }`}>
                  {c.days_to_expiry}d
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(c.value)}</span>
                {cached ? (
                  <Badge className={`text-[10px] font-bold border ${VERDICT_BADGE_STYLES[cached.verdict] || VERDICT_BADGE_STYLES.ESCALATE}`}>
                    {cached.verdict}
                  </Badge>
                ) : (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                    Analyze →
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function ConfirmDecisionSection({
  result,
}: {
  result: DecisionResult;
}) {
  const [staffDecision, setStaffDecision] = useState<string>(result.verdict);
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(`${API_BASE}/api/decision/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_number: result.contract_number,
          supplier: result.supplier,
          ai_verdict: result.verdict,
          staff_decision: staffDecision,
          notes,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      if (data.status === "error") throw new Error(data.detail || "Unknown error");
      setConfirmed(true);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : "Failed to confirm decision."
      );
    } finally {
      setConfirming(false);
    }
  }, [result, staffDecision, notes]);

  if (confirmed) {
    return (
      <Card className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Decision recorded.
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Contract {result.contract_number} marked as <span className="font-bold">{staffDecision}</span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options: Array<{ value: "RENEW" | "REBID" | "ESCALATE"; label: string; color: string; activeColor: string }> = [
    {
      value: "RENEW",
      label: "Confirm RENEW",
      color: "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      activeColor: "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500",
    },
    {
      value: "REBID",
      label: "Confirm REBID",
      color: "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30",
      activeColor: "bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500",
    },
    {
      value: "ESCALATE",
      label: "Confirm ESCALATE",
      color: "border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30",
      activeColor: "bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500",
    },
  ];

  return (
    <Card>
      <CardContent className="pt-2 space-y-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Confirm Your Decision
          </h3>
          <Badge variant="outline" className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
            Close the loop
          </Badge>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          The AI recommends <span className="font-bold">{result.verdict}</span>. Do you agree, or override with a different decision?
        </p>

        {/* Decision buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStaffDecision(opt.value)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                staffDecision === opt.value ? opt.activeColor : opt.color
              }`}
              aria-pressed={staffDecision === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Staff Notes */}
        <div>
          <label
            htmlFor="staff-notes"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Staff Notes <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="staff-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            placeholder="Add justification, conditions, or notes for the audit trail..."
          />
        </div>

        {/* Error */}
        {confirmError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {confirmError}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {confirming ? "Recording..." : `Record ${staffDecision} Decision`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function DecisionPageInner() {
  const searchParams = useSearchParams();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [webIntel, setWebIntel] = useState<{ results: { title: string; snippet: string; url: string }[]; query: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Read URL params on mount: ?supplier=X&contract=Y
  const paramSupplier = searchParams.get("supplier") || "";
  const paramContract = searchParams.get("contract") || "";

  // Auto-set vendor from URL params
  useEffect(() => {
    if (paramSupplier && !selectedVendor) {
      setSelectedVendor(paramSupplier);
    }
  }, [paramSupplier, selectedVendor]);

  // Fetch contracts for the selected vendor
  const { data: vendorData, isLoading: vendorLoading } = useQuery<VendorDetailResponse>({
    queryKey: ["decision-vendor-contracts", selectedVendor],
    queryFn: () =>
      fetchAPI<VendorDetailResponse>(
        `/api/contracts/vendor/${encodeURIComponent(selectedVendor)}`
      ),
    enabled: selectedVendor.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select contract from URL params once vendor data loads
  useEffect(() => {
    if (paramContract && vendorData?.contracts && !selectedContract && !autoTriggered) {
      const match = vendorData.contracts.find(
        (c) => c.contract_number === paramContract
      );
      if (match) {
        setSelectedContract(match);
      }
    }
  }, [paramContract, vendorData, selectedContract, autoTriggered]);

  // Auto-trigger analysis when both vendor and contract are set from URL
  const handleAnalyzeRef = useRef<() => void>();
  useEffect(() => {
    if (paramSupplier && paramContract && selectedContract && !autoTriggered && !analyzing && !result) {
      setAutoTriggered(true);
      // Small delay to let UI render
      setTimeout(() => handleAnalyzeRef.current?.(), 300);
    }
  }, [paramSupplier, paramContract, selectedContract, autoTriggered, analyzing, result]);

  // Reset downstream state when vendor changes
  useEffect(() => {
    if (!paramSupplier) {
      setSelectedContract(null);
      setResult(null);
      setError(null);
    }
  }, [selectedVendor, paramSupplier]);

  // Scroll to results when they load
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedContract || !selectedVendor) return;

    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_number: selectedContract.contract_number,
          supplier: selectedVendor,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = await res.json();
      // API wraps result in { decision: { ... } } — unwrap it
      const data = raw.decision ?? raw;
      const decision: DecisionResult = {
        ...data,
        pros: data.pros ?? [],
        cons: data.cons ?? [],
        memo: data.memo ?? "",
        contract_number: selectedContract.contract_number ?? "",
        supplier: selectedVendor,
        contract_value: selectedContract.value ?? 0,
        department: selectedContract.department ?? "",
        data_collected: raw.data_collected ?? undefined,
        confidence_factors: raw.confidence_factors ?? undefined,
        similar_contracts: raw.similar_contracts ?? undefined,
      };
      // Extract web intel
      setWebIntel(raw.web_intel ?? null);
      // If AI returned fallback (unavailable), auto-retry once after 3s
      if (data.confidence === "LOW" && data.summary?.includes("unavailable")) {
        await new Promise(r => setTimeout(r, 3000));
        const res2 = await fetch(`${API_BASE}/api/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contract_number: selectedContract.contract_number,
            supplier: selectedVendor,
          }),
        });
        if (res2.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw2: any = await res2.json();
          const retry = raw2.decision ?? raw2;
          if (retry.confidence !== "LOW" || !retry.summary?.includes("unavailable")) {
            setResult({
              ...retry,
              pros: retry.pros ?? [],
              cons: retry.cons ?? [],
              memo: retry.memo ?? "",
              contract_number: selectedContract.contract_number ?? "",
              supplier: selectedVendor,
              contract_value: selectedContract.value ?? 0,
              department: selectedContract.department ?? "",
              data_collected: raw2.data_collected ?? undefined,
              confidence_factors: raw2.confidence_factors ?? undefined,
              similar_contracts: raw2.similar_contracts ?? undefined,
            });
            return;
          }
        }
      }
      setResult(decision);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }, [selectedContract, selectedVendor]);

  // Keep ref updated for auto-trigger
  handleAnalyzeRef.current = handleAnalyze;

  const contracts = vendorData?.contracts || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                       */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 dark:from-violet-500/30 dark:to-blue-500/30">
            <Brain
              className="h-7 w-7 text-violet-600 dark:text-violet-400"
              aria-hidden="true"
            />
          </div>
          AI Decision Engine
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          AI-powered procurement decision intelligence. Select a contract for a
          comprehensive analysis.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Need a specific tool?{" "}
          <Link href="/staff/review" className="hover:text-blue-500 transition-colors">Review Workflow</Link>
          {" "}&middot;{" "}
          <Link href="/staff/renew" className="hover:text-blue-500 transition-colors">Renew Contract</Link>
          {" "}&middot;{" "}
          <Link href="/staff/compliance" className="hover:text-blue-500 transition-colors">Compliance Check</Link>
          {" "}&middot;{" "}
          <Link href="/staff/report" className="hover:text-blue-500 transition-colors">AI Report</Link>
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 1: Contract Selection                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardContent className="pt-2 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Select a Contract to Analyze
            </h2>
            <div className="max-w-md">
              <VendorSelect
                value={selectedVendor}
                onChange={setSelectedVendor}
                label="Vendor"
                placeholder="Search and select a vendor..."
              />
            </div>
          </div>

          {/* Suggested contracts when no vendor selected */}
          {!selectedVendor && <SuggestedContracts onSelect={(supplier, contractNum) => {
            setSelectedVendor(supplier);
            // Auto-trigger after vendor data loads will handle the rest via URL params logic
            setTimeout(() => {
              const url = new URL(window.location.href);
              url.searchParams.set("supplier", supplier);
              url.searchParams.set("contract", contractNum);
              window.history.replaceState({}, "", url.toString());
              window.location.reload();
            }, 100);
          }} />}

          {/* Vendor loading state */}
          {selectedVendor && vendorLoading && (
            <div className="flex items-center gap-2 py-6 justify-center">
              <Loader2
                className="h-5 w-5 animate-spin text-blue-600"
                aria-hidden="true"
              />
              <span className="text-sm text-slate-500">
                Loading contracts...
              </span>
            </div>
          )}

          {/* Contract cards grid */}
          {selectedVendor && !vendorLoading && contracts.length > 0 && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {contracts.length} contract{contracts.length !== 1 ? "s" : ""} found for{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedVendor}
                </span>
              </p>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1"
                role="listbox"
                aria-label="Select a contract"
              >
                {contracts.map((c) => (
                  <ContractCard
                    key={c.contract_number}
                    contract={c}
                    selected={selectedContract?.contract_number === c.contract_number}
                    onSelect={() => setSelectedContract(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No contracts */}
          {selectedVendor && !vendorLoading && contracts.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No contracts found for this vendor.
            </p>
          )}

          {/* Analyze button */}
          {selectedContract && !analyzing && !result && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleAnalyze}
                size="lg"
                className="gap-2 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 cursor-pointer"
                aria-label={`Analyze contract ${selectedContract.contract_number}`}
              >
                <Brain className="h-5 w-5" aria-hidden="true" />
                Analyze Contract
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2: Loading State                                          */}
      {/* ----------------------------------------------------------------- */}
      {analyzing && <AnalysisLoader />}

      {/* ----------------------------------------------------------------- */}
      {/* Error State                                                       */}
      {/* ----------------------------------------------------------------- */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-2">
            <div className="flex items-start gap-3 py-4">
              <AlertTriangle
                className="h-5 w-5 text-red-500 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  Analysis Failed
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  className="mt-3 gap-1.5"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Section 3: Results                                                */}
      {/* ----------------------------------------------------------------- */}
      {result && (
        <div ref={resultRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Layer 1: Traffic Light Verdict */}
          <VerdictSection result={result} />

          {/* AI Transparency: Data Analyzed */}
          {result.data_collected && (
            <DataAnalyzedSection data={result.data_collected} />
          )}

          {/* AI Transparency: Confidence Breakdown */}
          {result.confidence_factors && result.confidence_factors.length > 0 && (
            <ConfidenceBreakdown factors={result.confidence_factors} />
          )}

          {/* AI Transparency: Similar Contracts */}
          {result.similar_contracts && result.similar_contracts.length > 0 && (
            <SimilarContractsSection contracts={result.similar_contracts} />
          )}

          {/* Layer 2: Evidence Grid */}
          <EvidenceGrid pros={result.pros} cons={result.cons} />

          {/* Equity & Supplier Diversity */}
          {result.department && (
            <EquityConsideration department={result.department} />
          )}

          {/* Web Intelligence */}
          {webIntel && webIntel.results && webIntel.results.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  Vendor Web Intelligence
                  <Badge className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {webIntel.results.length} sources
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {webIntel.results.map((r: { title: string; snippet: string; url: string }, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.title}</p>
                      {r.snippet && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.snippet}</p>}
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                          View source →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Source: DuckDuckGo web search. Results are informational — verify independently.</p>
              </CardContent>
            </Card>
          )}

          {/* Alternative Vendors */}
          {result.department && (
            <AlternativeVendors
              department={result.department}
              currentSupplier={result.supplier}
            />
          )}

          {/* Layer 3: Decision Memo */}
          <DecisionMemo memo={result.memo} />

          {/* Action buttons */}
          <Card>
            <CardContent className="pt-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Next Steps
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {result.verdict === "RENEW" && (
                  <>
                    <Link
                      href="/staff/renew"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Start Renewal Process
                    </Link>
                    <Link
                      href="/staff/contracts"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <FileSearch className="h-4 w-4" aria-hidden="true" />
                      View Full Contract
                    </Link>
                  </>
                )}
                {result.verdict === "REBID" && (
                  <>
                    <Link
                      href="/staff/cost-analysis"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <GitCompare className="h-4 w-4" aria-hidden="true" />
                      Compare Vendors
                    </Link>
                    <Link
                      href="/staff/review"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      View Review Workflow
                    </Link>
                  </>
                )}
                {result.verdict === "ESCALATE" && (
                  <>
                    <Link
                      href="/staff/review"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      Open Review Workflow
                    </Link>
                    <Link
                      href="/staff/compliance"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-sm px-5 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Run Compliance Check
                    </Link>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResult(null);
                    setError(null);
                    setSelectedContract(null);
                  }}
                  className="gap-2 min-h-[44px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <Brain className="h-4 w-4" aria-hidden="true" />
                  Analyze Another Contract
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Decision — staff closes the loop */}
          <ConfirmDecisionSection result={result} />
        </div>
      )}
    </div>
  );
}

export default function DecisionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
      <DecisionPageInner />
    </Suspense>
  );
}
