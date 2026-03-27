"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "high" | "medium" | "low";

interface Anomaly {
  type: string;
  severity: Severity;
  title: string;
  count: number;
  description: string;
  recommendation: string;
}

interface AnomalyData {
  anomalies: Anomaly[];
  total: number;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Severity config (icon + text + color, never color alone)
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    Icon: React.ElementType;
    badgeClass: string;
    iconClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  high: {
    label: "High",
    Icon: AlertOctagon,
    badgeClass:
      "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700",
    iconClass: "text-red-600 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-700",
    bgClass: "bg-red-50 dark:bg-red-950",
  },
  medium: {
    label: "Medium",
    Icon: AlertTriangle,
    badgeClass:
      "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
    iconClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-700",
    bgClass: "bg-amber-50 dark:bg-amber-950",
  },
  low: {
    label: "Low",
    Icon: Info,
    badgeClass:
      "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
    iconClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-700",
    bgClass: "bg-blue-50 dark:bg-blue-950",
  },
};

// ---------------------------------------------------------------------------
// Anomaly Card
// ---------------------------------------------------------------------------

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const sev = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.low;
  const { Icon } = sev;

  return (
    <article
      aria-label={`${sev.label} severity: ${anomaly.title}`}
      className={`rounded-xl border ${sev.borderClass} ${sev.bgClass} p-5`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Icon
          className={`h-5 w-5 shrink-0 mt-0.5 ${sev.iconClass}`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {anomaly.title}
            </h3>
            {/* Severity badge — icon + text, not color alone */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sev.badgeClass}`}
              aria-label={`Severity: ${sev.label}`}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              {sev.label}
            </span>
            {anomaly.count > 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {anomaly.count.toLocaleString()} instances
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
            {anomaly.description}
          </p>

          {/* Recommendation */}
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <ChevronRight
              className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">Recommendation: </span>
              {anomaly.recommendation}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function SummaryBar({ anomalies }: { anomalies: Anomaly[] }) {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const a of anomalies) {
    if (a.severity in counts) counts[a.severity]++;
  }

  const items: Array<{ severity: Severity; label: string }> = [
    { severity: "high", label: "High" },
    { severity: "medium", label: "Medium" },
    { severity: "low", label: "Low" },
  ];

  return (
    <div
      className="flex flex-wrap gap-3"
      role="group"
      aria-label="Anomaly severity summary"
    >
      {items.map(({ severity, label }) => {
        const cfg = SEVERITY_CONFIG[severity];
        const { Icon } = cfg;
        return (
          <div
            key={severity}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${cfg.borderClass} ${cfg.bgClass}`}
          >
            <Icon
              className={`h-4 w-4 ${cfg.iconClass}`}
              aria-hidden="true"
            />
            <span className={`text-sm font-semibold ${cfg.iconClass}`}>
              {counts[severity]}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnomaliesPage() {
  const { data, isLoading, isError } = useQuery<AnomalyData>({
    queryKey: ["contract-anomalies"],
    queryFn: () => fetchAPI<AnomalyData>("/api/mbe/anomalies"),
    staleTime: 5 * 60 * 1000,
  });

  const anomalies = data?.anomalies ?? [];
  const hasHigh = anomalies.some((a) => a.severity === "high");

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertOctagon
            className="h-7 w-7 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          Contract Anomaly Detection
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Statistically unusual patterns flagged for human review — not
          compliance findings.
        </p>
      </div>

      {/* Disclaimer */}
      <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info
              className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Important:{" "}
              </span>
              {data?.disclaimer ??
                "Anomalies are statistical patterns, not compliance findings. All require human review."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading anomaly data">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm"
        >
          Unable to load anomaly data. Please try again later.
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Summary
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {anomalies.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">
                    No anomalies detected in current data.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {anomalies.length} pattern
                    {anomalies.length !== 1 ? "s" : ""} flagged across contract
                    data.
                  </p>
                  <SummaryBar anomalies={anomalies} />
                  {hasHigh && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700"
                    >
                      <AlertOctagon
                        className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                        High-severity patterns require prompt attention.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Anomaly list */}
          {anomalies.length > 0 && (
            <section aria-label="Detected anomalies">
              <h2 className="sr-only">Detected anomalies</h2>
              <div className="space-y-4">
                {anomalies.map((anomaly, i) => (
                  <AnomalyCard key={`${anomaly.type}-${i}`} anomaly={anomaly} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
