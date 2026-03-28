"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Building2,
  Clock,
} from "lucide-react";

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
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Expiry Forecast Bar */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Expiry Forecast
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Next 30 days */}
          <Card className="border-l-4 border-l-red-500 dark:border-l-red-400">
            <CardContent className="py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                Next 30 Days
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {(forecast.next_30 ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(forecast.value_30 ?? 0)}
              </p>
            </CardContent>
          </Card>

          {/* 31-60 days */}
          <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400">
            <CardContent className="py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                31 - 60 Days
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {(forecast.next_60 ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(forecast.value_60 ?? 0)}
              </p>
            </CardContent>
          </Card>

          {/* 61-90 days */}
          <Card className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
            <CardContent className="py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                61 - 90 Days
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {(forecast.next_90 ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(forecast.value_90 ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Risk Distribution */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            Portfolio Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskBar distribution={data.risk_distribution} total={data.total_contracts} />
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Department Grade Cards */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Department Grades
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.department_grades.map((dept) => {
            const gc = GRADE_COLORS[dept.grade] || GRADE_COLORS.F;
            return (
              <Card key={dept.department} className="overflow-hidden">
                <CardContent className="py-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={dept.department}>
                        {dept.department}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {dept.total} contracts
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-lg font-bold ring-1 ${gc.bg} ${gc.text} ${gc.ring}`}
                      aria-label={`Grade: ${dept.grade}`}
                    >
                      {dept.grade}
                    </span>
                  </div>

                  {/* Value */}
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(dept.total_value)}
                  </p>

                  {/* Mini risk bar */}
                  <DeptRiskBar dept={dept} />

                  {/* Counts */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    {dept.ok > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {dept.ok} OK
                      </span>
                    )}
                    {dept.warning > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {dept.warning} Warning
                      </span>
                    )}
                    {dept.critical > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        {dept.critical} Critical
                      </span>
                    )}
                    {dept.expired > 0 && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {dept.expired} Expired
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Top Anomalies */}
      {/* ----------------------------------------------------------------- */}
      {data.anomalies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Top Anomalies
            </h2>
          </div>
          <div className="space-y-3">
            {data.anomalies.map((a, i) => {
              const isHigh = a.severity === "high";
              return (
                <Card
                  key={`${a.type}-${i}`}
                  className={`border-l-4 ${
                    isHigh
                      ? "border-l-red-500 dark:border-l-red-400"
                      : "border-l-amber-500 dark:border-l-amber-400"
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      {/* Severity badge */}
                      <Badge
                        className={
                          isHigh
                            ? "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                            : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                        }
                      >
                        {isHigh ? "High" : "Medium"}
                      </Badge>

                      {/* Type label */}
                      <Badge variant="outline" className="text-xs">
                        {a.type === "expired_high_value"
                          ? "Expired High Value"
                          : "Concentration Risk"}
                      </Badge>

                      {/* Vendor */}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {a.supplier}
                      </span>

                      {/* Spacer */}
                      <span className="hidden sm:block flex-1" />

                      {/* Value */}
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(a.value)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {a.detail}
                      {a.contract_number && (
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                          #{a.contract_number}
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
