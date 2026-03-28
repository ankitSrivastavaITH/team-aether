"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Building2,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { CollapsibleSection } from "@/components/collapsible-section";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RiskBucket {
  risk_level: string;
  count: number;
  value: number;
}

interface DepartmentGrade {
  department: string;
  total: number;
  total_value: number;
  critical: number;
  warning: number;
  expired: number;
  ok: number;
  grade: string;
}

interface Anomaly {
  type: string;
  severity: "high" | "medium";
  supplier: string;
  contract_number?: string;
  department?: string;
  value: number;
  detail: string;
}

interface ExpiryForecast {
  next_30: number;
  value_30: number;
  next_60: number;
  value_60: number;
  next_90: number;
  value_90: number;
}

interface HealthScanData {
  health_score: number;
  total_contracts: number;
  total_value: number;
  risk_distribution: RiskBucket[];
  department_grades: DepartmentGrade[];
  anomalies: Anomaly[];
  expiry_forecast: ExpiryForecast;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A: {
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-300 dark:ring-emerald-700",
  },
  B: {
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-300 dark:ring-blue-700",
  },
  C: {
    bg: "bg-amber-100 dark:bg-amber-900/50",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-300 dark:ring-amber-700",
  },
  D: {
    bg: "bg-orange-100 dark:bg-orange-900/50",
    text: "text-orange-700 dark:text-orange-300",
    ring: "ring-orange-300 dark:ring-orange-700",
  },
  F: {
    bg: "bg-red-100 dark:bg-red-900/50",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-300 dark:ring-red-700",
  },
};

const RISK_COLORS: Record<string, string> = {
  ok: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  critical: "bg-red-500 dark:bg-red-400",
  expired: "bg-slate-400 dark:bg-slate-500",
  attention: "bg-orange-500 dark:bg-orange-400",
  unknown: "bg-slate-300 dark:bg-slate-600",
};

const RISK_LABELS: Record<string, string> = {
  ok: "OK",
  warning: "Warning",
  critical: "Critical",
  expired: "Expired",
  attention: "Attention",
  unknown: "Unknown",
};

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function HealthScoreRing({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = "text-red-500 dark:text-red-400";
  let bgRing = "text-red-100 dark:text-red-900/40";
  if (score > 70) {
    color = "text-emerald-500 dark:text-emerald-400";
    bgRing = "text-emerald-100 dark:text-emerald-900/40";
  } else if (score > 40) {
    color = "text-amber-500 dark:text-amber-400";
    bgRing = "text-amber-100 dark:text-amber-900/40";
  }

  return (
    <div className="relative w-48 h-48 mx-auto" role="img" aria-label={`Health score: ${score} out of 100`}>
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          className={`stroke-current ${bgRing}`}
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`stroke-current ${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          / 100
        </span>
      </div>
    </div>
  );
}

function RiskBar({ distribution, total }: { distribution: RiskBucket[]; total: number }) {
  if (!distribution.length || total === 0) return null;

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700" role="img" aria-label="Risk distribution bar">
        {distribution.map((bucket) => {
          const pct = (bucket.count / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={bucket.risk_level}
              className={`${RISK_COLORS[bucket.risk_level] || RISK_COLORS.unknown} transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${RISK_LABELS[bucket.risk_level] || bucket.risk_level}: ${bucket.count} contracts (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {distribution.map((bucket) => (
          <div key={bucket.risk_level} className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${RISK_COLORS[bucket.risk_level] || RISK_COLORS.unknown}`}
              aria-hidden="true"
            />
            <span className="text-slate-600 dark:text-slate-400">
              {RISK_LABELS[bucket.risk_level] || bucket.risk_level}:
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {bucket.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptRiskBar({ dept }: { dept: DepartmentGrade }) {
  const segments = [
    { key: "ok", count: dept.ok, color: RISK_COLORS.ok },
    { key: "warning", count: dept.warning, color: RISK_COLORS.warning },
    { key: "critical", count: dept.critical, color: RISK_COLORS.critical },
    { key: "expired", count: dept.expired, color: RISK_COLORS.expired },
  ];
  const total = dept.total || 1;

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800" role="img" aria-label={`${dept.department} risk breakdown`}>
      {segments.map((seg) => {
        const pct = (seg.count / total) * 100;
        if (pct < 0.5) return null;
        return (
          <div
            key={seg.key}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HealthScannerPage() {
  const { data, isLoading, error } = useQuery<HealthScanData>({
    queryKey: ["health-scan"],
    queryFn: () => fetchAPI<HealthScanData>("/api/health-scan"),
    staleTime: 60_000,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scanning portfolio health across all contracts...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load health scan data. Please try again.
        </p>
      </div>
    );
  }

  const forecast = data.expiry_forecast;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Activity className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Contract Health Scanner
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-10">
          AI-powered portfolio analysis across {data.total_contracts.toLocaleString()} contracts.
          No chatbot — pure structured intelligence.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. Health Score Hero */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthScoreRing score={data.health_score} />
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Portfolio Health Score
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Based on the proportion of contracts in good standing across all departments.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {data.total_contracts.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Contracts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(data.total_value)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
                </div>
              </div>
            </div>

            {/* Actionable recommendation based on score */}
            <div className={`w-full md:w-auto mt-4 md:mt-0 p-4 rounded-lg border ${
              data.health_score > 70
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : data.health_score > 40
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            }`}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4" aria-hidden="true" />
                Top Priority Action
              </p>
              {data.health_score <= 40 ? (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {(data.expiry_forecast.next_30 ?? 0)} contracts expire in 30 days worth {formatCurrency(data.expiry_forecast.value_30 ?? 0)}. Start with the highest-value critical contracts.
                  </p>
                  <Link href="/staff/decision" className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:underline">
                    Analyze Critical Contracts <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : data.health_score <= 70 ? (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {data.department_grades.filter(d => d.grade === "D" || d.grade === "F").length} departments are at grade D or F. Focus on vendor diversification and renewals.
                  </p>
                  <Link href="/staff/decision" className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline">
                    Review At-Risk Departments <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Portfolio is healthy. Monitor upcoming expirations and maintain competitive bidding practices.
                  </p>
                  <Link href="/staff/contracts" className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
                    View All Contracts <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Expiry Forecast */}
      <CollapsibleSection
        title="Expiry Forecast"
        icon={Clock}
        badge={`${(forecast.next_30 ?? 0) + (forecast.next_60 ?? 0) + (forecast.next_90 ?? 0)} contracts`}
        defaultOpen
        summary={`${forecast.next_30 ?? 0} in 30 days (${formatCurrency(forecast.value_30 ?? 0)})`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Next 30 Days", count: forecast.next_30 ?? 0, value: forecast.value_30 ?? 0, color: "red", action: "Urgent — renew or rebid now", link: "/staff/renew" },
            { label: "31 - 60 Days", count: forecast.next_60 ?? 0, value: forecast.value_60 ?? 0, color: "amber", action: "Plan renewal decisions", link: "/staff/decision" },
            { label: "61 - 90 Days", count: forecast.next_90 ?? 0, value: forecast.value_90 ?? 0, color: "emerald", action: "Schedule vendor reviews", link: "/staff/review" },
          ].map(({ label, count, value, color, action, link }) => (
            <Card key={label} className={`border-l-4 border-l-${color}-500 dark:border-l-${color}-400`}>
              <CardContent className="py-5 space-y-3">
                <p className={`text-xs font-semibold uppercase tracking-wider text-${color}-600 dark:text-${color}-400 mb-1`}>{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count.toLocaleString()}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(value)}</p>
                {count > 0 && (
                  <Link href={link} className={`inline-flex items-center gap-1.5 text-xs font-medium text-${color}-700 dark:text-${color}-400 hover:underline`}>
                    {action} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>

      {/* 3. Risk Distribution */}
      <CollapsibleSection
        title="Portfolio Risk Distribution"
        icon={TrendingUp}
        summary={`${data.risk_distribution.find(r => r.risk_level === "ok")?.count ?? 0} OK, ${data.risk_distribution.find(r => r.risk_level === "critical")?.count ?? 0} Critical`}
      >
        <RiskBar distribution={data.risk_distribution} total={data.total_contracts} />
      </CollapsibleSection>

      {/* 4. Top Anomalies (MOVED UP) */}
      {data.anomalies.length > 0 && (
        <CollapsibleSection
          title="Top Anomalies"
          icon={ShieldAlert}
          badge={`${data.anomalies.filter(a => a.severity === "high").length} high`}
          badgeClass="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          defaultOpen
          summary={`${data.anomalies.length} anomalies detected`}
        >
          <div className="space-y-3">
            {data.anomalies.map((a, i) => {
              const isHigh = a.severity === "high";
              return (
                <Card
                  key={`${a.type}-${i}`}
                  className={`border-l-4 ${isHigh ? "border-l-red-500 dark:border-l-red-400" : "border-l-amber-500 dark:border-l-amber-400"}`}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <Badge className={isHigh
                        ? "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                        : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                      }>
                        {isHigh ? "High" : "Medium"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {a.type === "expired_high_value" ? "Expired High Value" : "Concentration Risk"}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.supplier}</span>
                      <span className="hidden sm:block flex-1" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(a.value)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {a.detail}
                      {a.contract_number && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">#{a.contract_number}</span>}
                    </p>
                    <div className="mt-2 flex gap-3">
                      {a.type === "expired_high_value" && a.contract_number && (
                        <Link href="/staff/decision" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          <Zap className="h-3 w-3" /> Analyze Decision
                        </Link>
                      )}
                      {a.type === "concentration_risk" && a.department && (
                        <Link href="/staff/cost-analysis" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          <TrendingUp className="h-3 w-3" /> Compare Vendors
                        </Link>
                      )}
                      <Link href="/staff/compliance" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline">
                        <ShieldAlert className="h-3 w-3" /> Check Compliance
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* 5. Department Grades */}
      <CollapsibleSection
        title="Department Grades"
        icon={Building2}
        badge={`${data.department_grades.filter(d => d.grade === "D" || d.grade === "F").length} at-risk`}
        badgeClass="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
        summary={`${data.department_grades.length} departments graded A-F`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.department_grades.map((dept) => {
            const gc = GRADE_COLORS[dept.grade] || GRADE_COLORS.F;
            return (
              <Card key={dept.department} className="overflow-hidden">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={dept.department}>{dept.department}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{dept.total} contracts</p>
                    </div>
                    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-lg font-bold ring-1 ${gc.bg} ${gc.text} ${gc.ring}`} aria-label={`Grade: ${dept.grade}`}>
                      {dept.grade}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(dept.total_value)}</p>
                  <DeptRiskBar dept={dept} />
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    {dept.ok > 0 && <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"><CheckCircle className="h-3 w-3" aria-hidden="true" /> {dept.ok} OK</span>}
                    {dept.warning > 0 && <span className="text-amber-600 dark:text-amber-400">{dept.warning} Warning</span>}
                    {dept.critical > 0 && <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5"><XCircle className="h-3 w-3" aria-hidden="true" /> {dept.critical} Critical</span>}
                    {dept.expired > 0 && <span className="text-slate-500 dark:text-slate-400">{dept.expired} Expired</span>}
                  </div>
                  {(dept.grade === "D" || dept.grade === "F") && (
                    <Link href={`/staff/contracts?department=${encodeURIComponent(dept.department)}`} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline">
                      Review {dept.critical + dept.expired} at-risk contracts <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {dept.grade === "C" && (
                    <Link href={`/staff/contracts?department=${encodeURIComponent(dept.department)}`} className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
                      Monitor {dept.warning} warning contracts <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}
