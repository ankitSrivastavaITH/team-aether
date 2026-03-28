"use client";

import { Fragment, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  ArrowRight,
  DollarSign,
  FileText,
  Lightbulb,
  BookOpen,
  ShieldAlert,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
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
  ai_recommendation?: string;
  related_contracts?: string[];
  financial_impact?: number;
  vendor_name?: string;
  department_name?: string;
}

interface AnomalyData {
  anomalies: Anomaly[];
  total: number;
  total_financial_impact?: number;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Severity config — icon + text + accessible colour classes
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    Icon: React.ElementType;
    badgeClass: string;
    iconClass: string;
    leftBorderClass: string;
    cardBgClass: string;
    sectionBgClass: string;
    sectionBorderClass: string;
  }
> = {
  high: {
    label: "High Priority",
    Icon: AlertOctagon,
    badgeClass:
      "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700",
    iconClass: "text-red-600 dark:text-red-400",
    leftBorderClass: "border-l-4 border-l-red-500 dark:border-l-red-400",
    cardBgClass: "bg-white dark:bg-slate-900",
    sectionBgClass: "bg-red-50 dark:bg-red-950/30",
    sectionBorderClass: "border-red-200 dark:border-red-800",
  },
  medium: {
    label: "Medium Priority",
    Icon: AlertTriangle,
    badgeClass:
      "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
    iconClass: "text-amber-600 dark:text-amber-400",
    leftBorderClass: "border-l-4 border-l-amber-500 dark:border-l-amber-400",
    cardBgClass: "bg-white dark:bg-slate-900",
    sectionBgClass: "bg-amber-50 dark:bg-amber-950/30",
    sectionBorderClass: "border-amber-200 dark:border-amber-800",
  },
  low: {
    label: "Low Priority",
    Icon: Info,
    badgeClass:
      "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700",
    iconClass: "text-blue-600 dark:text-blue-400",
    leftBorderClass: "border-l-4 border-l-blue-500 dark:border-l-blue-400",
    cardBgClass: "bg-white dark:bg-slate-900",
    sectionBgClass: "bg-blue-50 dark:bg-blue-950/30",
    sectionBorderClass: "border-blue-200 dark:border-blue-800",
  },
};

// ---------------------------------------------------------------------------
// Plain-language "what this means" explainers by anomaly type
// ---------------------------------------------------------------------------

const EXPLAINERS: Record<string, string> = {
  zero_value:
    "These contracts may have incomplete data, making total spending calculations inaccurate. They could represent real spending that is not being tracked.",
  long_expired:
    "Contracts expired over a year ago may still be used for purchasing, which violates procurement policy. City money spent against expired contracts has no legal protection.",
  high_concentration:
    "When one vendor holds a large share of a department's spending, the city has less negotiating power and higher risk if that vendor fails or raises prices.",
  long_term:
    "Contracts over 5 years may not have been competitively re-bid, which is often required by procurement law. Prices may no longer reflect current market rates.",
  price_outlier:
    "This contract is significantly more expensive than similar contracts in the same department. It may have been awarded without competitive bidding, or the scope may differ.",
};

// ---------------------------------------------------------------------------
// Risk Matrix — severity x likelihood classification
// ---------------------------------------------------------------------------

type Likelihood = "frequent" | "occasional" | "rare";

interface RiskCell {
  severity: Severity;
  likelihood: Likelihood;
}

const ANOMALY_RISK_MAP: Record<string, RiskCell> = {
  long_expired: { severity: "high", likelihood: "frequent" },
  price_outlier: { severity: "high", likelihood: "occasional" },
  high_concentration: { severity: "medium", likelihood: "frequent" },
  long_term: { severity: "medium", likelihood: "occasional" },
  zero_value: { severity: "low", likelihood: "occasional" },
};

const DEFAULT_RISK_CELL: RiskCell = {
  severity: "medium",
  likelihood: "occasional",
};

function classifyAnomaly(type: string): RiskCell {
  return ANOMALY_RISK_MAP[type] ?? DEFAULT_RISK_CELL;
}

const LIKELIHOOD_LABELS: Likelihood[] = ["frequent", "occasional", "rare"];
const SEVERITY_LABELS: Severity[] = ["high", "medium", "low"];

const MATRIX_CELL_STYLES: Record<string, string> = {
  "high-frequent":
    "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600",
  "high-occasional":
    "bg-red-400 dark:bg-red-600 text-white hover:bg-red-500 dark:hover:bg-red-500",
  "high-rare":
    "bg-amber-400 dark:bg-amber-600 text-slate-900 dark:text-white hover:bg-amber-500 dark:hover:bg-amber-500",
  "medium-frequent":
    "bg-amber-400 dark:bg-amber-600 text-slate-900 dark:text-white hover:bg-amber-500 dark:hover:bg-amber-500",
  "medium-occasional":
    "bg-amber-300 dark:bg-amber-700 text-slate-900 dark:text-amber-100 hover:bg-amber-400 dark:hover:bg-amber-600",
  "medium-rare":
    "bg-yellow-200 dark:bg-yellow-800 text-slate-900 dark:text-yellow-100 hover:bg-yellow-300 dark:hover:bg-yellow-700",
  "low-frequent":
    "bg-amber-300 dark:bg-amber-700 text-slate-900 dark:text-amber-100 hover:bg-amber-400 dark:hover:bg-amber-600",
  "low-occasional":
    "bg-yellow-200 dark:bg-yellow-800 text-slate-900 dark:text-yellow-100 hover:bg-yellow-300 dark:hover:bg-yellow-700",
  "low-rare":
    "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-700",
};

// ---------------------------------------------------------------------------
// Remediation steps per anomaly type
// ---------------------------------------------------------------------------

const REMEDIATION_STEPS: Record<string, string[]> = {
  long_expired: [
    "Verify contract status with department.",
    "Initiate renewal or closeout immediately.",
    "Assess if services are still being received without a valid agreement.",
  ],
  price_outlier: [
    "Review pricing against market benchmarks.",
    "Compare with similar contracts in the same department.",
    "Consider competitive rebid if pricing is not justified.",
  ],
  high_concentration: [
    "Identify alternative vendors in this category.",
    "Plan competitive solicitation for next renewal.",
    "Review MBE/small business options to diversify.",
  ],
  long_term: [
    "Check if contract has been competitively re-bid per procurement policy.",
    "Verify pricing still reflects current market rates.",
    "Schedule review with department stakeholders.",
  ],
  zero_value: [
    "Verify if contract data is complete in the system.",
    "Confirm whether spending is tracked under a different record.",
    "Update contract value if information is available.",
  ],
};

const DEFAULT_REMEDIATION: string[] = [
  "Flag for procurement officer review.",
  "Document findings in contract file.",
];

function getRemediationSteps(type: string): string[] {
  return REMEDIATION_STEPS[type] ?? DEFAULT_REMEDIATION;
}

// ---------------------------------------------------------------------------
// Department health grading
// ---------------------------------------------------------------------------

type HealthGrade = "A" | "B" | "C" | "D" | "F";

interface DepartmentHealth {
  department: string;
  count: number;
  grade: HealthGrade;
}

function computeGrade(count: number): HealthGrade {
  if (count === 0) return "A";
  if (count <= 2) return "B";
  if (count <= 5) return "C";
  if (count <= 8) return "D";
  return "F";
}

const GRADE_STYLES: Record<HealthGrade, string> = {
  A: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
  B: "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
  C: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700",
  D: "bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
  F: "bg-red-200 dark:bg-red-900/80 text-red-900 dark:text-red-100 border-red-400 dark:border-red-600",
};

// ---------------------------------------------------------------------------
// Action link resolver
// ---------------------------------------------------------------------------

function getActionLink(anomaly: Anomaly): { href: string; label: string } | null {
  switch (anomaly.type) {
    case "high_concentration":
      if (anomaly.vendor_name) {
        return {
          href: `/public/vendor/${encodeURIComponent(anomaly.vendor_name)}`,
          label: "View vendor profile",
        };
      }
      return null;
    case "long_expired":
      return {
        href: "/staff/contracts?risk_level=expired",
        label: "View expired contracts",
      };
    case "zero_value":
      return {
        href: "/staff/contracts?search=0",
        label: "View zero-value contracts",
      };
    case "long_term":
      return {
        href: "/staff/contracts",
        label: "Browse all contracts",
      };
    case "price_outlier":
      if (anomaly.vendor_name) {
        return {
          href: `/public/vendor/${encodeURIComponent(anomaly.vendor_name)}`,
          label: "View vendor profile",
        };
      }
      if (anomaly.department_name) {
        return {
          href: `/public/department/${encodeURIComponent(anomaly.department_name)}`,
          label: "View department spending",
        };
      }
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Format dollar values
// ---------------------------------------------------------------------------

function formatDollars(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Anomaly Card (rich redesign)
// ---------------------------------------------------------------------------

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const sev = SEVERITY_CONFIG[anomaly.severity] ?? SEVERITY_CONFIG.low;
  const { Icon } = sev;
  const explainer = EXPLAINERS[anomaly.type];
  const actionLink = getActionLink(anomaly);

  return (
    <article
      aria-label={`${sev.label}: ${anomaly.title}`}
      className={`rounded-xl border border-slate-200 dark:border-slate-700 ${sev.leftBorderClass} ${sev.cardBgClass} shadow-sm overflow-hidden`}
    >
      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Header row: icon + title + severity badge + count pill */}
        <div className="flex items-start gap-3">
          <Icon
            className={`h-5 w-5 shrink-0 mt-0.5 ${sev.iconClass}`}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {anomaly.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sev.badgeClass}`}
                aria-label={`Severity: ${sev.label}`}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {sev.label}
              </span>
              {anomaly.count > 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  {anomaly.count.toLocaleString()} contracts affected
                </span>
              )}
              {typeof anomaly.financial_impact === "number" && anomaly.financial_impact > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  <DollarSign className="h-3 w-3" aria-hidden="true" />
                  {formatDollars(anomaly.financial_impact)} at risk
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {anomaly.description}
            </p>
          </div>
        </div>

        {/* "What this means" — plain-language explainer */}
        {explainer && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <BookOpen
              className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
                What this means
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {explainer}
              </p>
            </div>
          </div>
        )}

        {/* AI recommendation (highlighted box) */}
        {anomaly.ai_recommendation && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800">
            <Lightbulb
              className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-0.5">
                AI Recommendation
              </p>
              <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed font-medium">
                {anomaly.ai_recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Remediation steps */}
        <RemediationBox type={anomaly.type} />

        {/* Related contract numbers */}
        {anomaly.related_contracts && anomaly.related_contracts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Example contract numbers
            </p>
            <div className="flex flex-wrap gap-2">
              {anomaly.related_contracts.map((cn) => (
                <Link
                  key={cn}
                  href={`/staff/contracts?search=${encodeURIComponent(cn)}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label={`Search for contract ${cn}`}
                >
                  {cn}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action footer */}
        {actionLink && (
          <div className="pt-1">
            <a
              href={actionLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-sm font-semibold ${sev.iconClass} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded`}
              aria-label={actionLink.label}
            >
              {actionLink.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Severity section header
// ---------------------------------------------------------------------------

function SeveritySectionHeader({
  severity,
  count,
}: {
  severity: Severity;
  count: number;
}) {
  const sev = SEVERITY_CONFIG[severity];
  const { Icon } = sev;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${sev.sectionBorderClass} ${sev.sectionBgClass}`}
      role="heading"
      aria-level={2}
    >
      <Icon className={`h-4 w-4 ${sev.iconClass}`} aria-hidden="true" />
      <span className={`font-bold text-sm ${sev.iconClass}`}>
        {sev.label}
      </span>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        — {count} {count === 1 ? "issue" : "issues"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary bar (severity counts)
// ---------------------------------------------------------------------------

function SummaryBar({ anomalies }: { anomalies: Anomaly[] }) {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const a of anomalies) {
    if (a.severity in counts) counts[a.severity]++;
  }

  const items: Array<{ severity: Severity }> = [
    { severity: "high" },
    { severity: "medium" },
    { severity: "low" },
  ];

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Anomaly severity counts"
    >
      {items.map(({ severity }) => {
        const cfg = SEVERITY_CONFIG[severity];
        const { Icon } = cfg;
        return (
          <div
            key={severity}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.badgeClass}`}
          >
            <Icon className={`h-4 w-4 ${cfg.iconClass}`} aria-hidden="true" />
            <span className={`text-sm font-semibold ${cfg.iconClass}`}>
              {counts[severity]} {cfg.label.replace(" Priority", "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Matrix visualization (3x3 grid)
// ---------------------------------------------------------------------------

function RiskMatrix({
  anomalies,
  onCellClick,
}: {
  anomalies: Anomaly[];
  onCellClick: (severity: Severity, likelihood: Likelihood) => void;
}) {
  // Build counts for each cell
  const matrix = useMemo(() => {
    const grid: Record<string, number> = {};
    for (const sev of SEVERITY_LABELS) {
      for (const lik of LIKELIHOOD_LABELS) {
        grid[`${sev}-${lik}`] = 0;
      }
    }
    for (const a of anomalies) {
      const cell = classifyAnomaly(a.type);
      grid[`${cell.severity}-${cell.likelihood}`] += 1;
    }
    return grid;
  }, [anomalies]);

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Risk Matrix
          </h2>
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Anomalies mapped by severity and likelihood. Click a cell to jump to
          matching anomalies.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: "auto 1fr 1fr 1fr",
            gridTemplateRows: "auto 1fr 1fr 1fr",
          }}
          role="grid"
          aria-label="Risk matrix: severity vs likelihood"
        >
          {/* Header row */}
          <div className="flex items-end justify-center p-2" aria-hidden="true" />
          {LIKELIHOOD_LABELS.map((lik) => (
            <div
              key={lik}
              className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 p-2"
              role="columnheader"
            >
              {lik}
            </div>
          ))}

          {/* Grid rows */}
          {SEVERITY_LABELS.map((sev) => (
            <Fragment key={sev}>
              {/* Row header */}
              <div
                className="flex items-center justify-end pr-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                role="rowheader"
              >
                {sev}
              </div>
              {/* Cells */}
              {LIKELIHOOD_LABELS.map((lik) => {
                const key = `${sev}-${lik}`;
                const count = matrix[key];
                const cellStyle = MATRIX_CELL_STYLES[key] ?? "";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onCellClick(sev, lik)}
                    className={`flex flex-col items-center justify-center rounded-lg p-3 min-h-[4rem] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 cursor-pointer ${cellStyle}`}
                    role="gridcell"
                    aria-label={`${sev} severity, ${lik} likelihood: ${count} anomalies`}
                  >
                    <span className="text-2xl font-bold leading-none">{count}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-medium mt-0.5 opacity-80">
                        {count === 1 ? "anomaly" : "anomalies"}
                      </span>
                    )}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
        {/* Axis labels */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Severity (rows)
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Likelihood (columns)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Department Health Grades
// ---------------------------------------------------------------------------

function DepartmentHealthGrades({ anomalies }: { anomalies: Anomaly[] }) {
  const grades = useMemo<DepartmentHealth[]>(() => {
    const deptCounts: Record<string, number> = {};
    for (const a of anomalies) {
      const dept = a.department_name ?? "Unknown";
      deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
    }
    return Object.entries(deptCounts)
      .map(([department, count]) => ({
        department,
        count,
        grade: computeGrade(count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [anomalies]);

  if (grades.length === 0) return null;

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap
              className="h-5 w-5 text-slate-500 dark:text-slate-400"
              aria-hidden="true"
            />
            Department Health Grades
          </h2>
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Grades based on anomaly count per department: A (0), B (1-2), C (3-5),
          D/F (6+)
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Department health grades"
        >
          {grades.map((dh) => (
            <div
              key={dh.department}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${GRADE_STYLES[dh.grade]}`}
              role="listitem"
              aria-label={`${dh.department}: grade ${dh.grade}, ${dh.count} anomalies`}
            >
              <span>{dh.department}:</span>
              <span className="font-black text-base leading-none">{dh.grade}</span>
              <span className="text-xs opacity-70">({dh.count})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Remediation info box (within each anomaly card)
// ---------------------------------------------------------------------------

function RemediationBox({ type }: { type: string }) {
  const steps = getRemediationSteps(type);
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
      <ClipboardCheck
        className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide mb-1">
          Recommended Action
        </p>
        <ol className="list-decimal list-inside space-y-0.5">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="text-sm text-sky-800 dark:text-sky-300 leading-relaxed"
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
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

  // Group by severity
  const highAnomalies = anomalies.filter((a) => a.severity === "high");
  const medAnomalies = anomalies.filter((a) => a.severity === "medium");
  const lowAnomalies = anomalies.filter((a) => a.severity === "low");

  const totalImpact = data?.total_financial_impact ?? 0;
  const totalFlagged = anomalies.reduce((sum, a) => sum + (a.count ?? 0), 0);

  // Refs for scroll-to-section from risk matrix
  const highRef = useRef<HTMLDivElement>(null);
  const medRef = useRef<HTMLDivElement>(null);
  const lowRef = useRef<HTMLDivElement>(null);

  const handleCellClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (severity: Severity, _likelihood: Likelihood) => {
      const refMap: Record<Severity, React.RefObject<HTMLDivElement | null>> = {
        high: highRef,
        medium: medRef,
        low: lowRef,
      };
      refMap[severity]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldAlert
            className="h-7 w-7 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          Contract Anomaly Detection
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          AI-powered analysis of 1,365 contracts flagging statistical patterns
          that may indicate risk
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

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading anomaly data">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Error state */}
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
          {/* Empty state */}
          {anomalies.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <CheckCircle
                className="h-16 w-16 text-emerald-500 dark:text-emerald-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  No anomalies detected
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  All contracts appear healthy. No unusual patterns were found.
                </p>
              </div>
            </div>
          )}

          {/* Summary card */}
          {anomalies.length > 0 && (
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Risk Summary
                  </h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Severity pill summary */}
                <SummaryBar anomalies={anomalies} />

                {/* Financial exposure + contract count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <FileText
                      className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Total contracts flagged
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {totalFlagged.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {totalImpact > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <DollarSign
                        className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Estimated value at risk
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatDollars(totalImpact)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* High severity alert banner */}
                {hasHigh && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700"
                  >
                    <AlertOctagon
                      className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                      High-priority issues require prompt attention from the procurement team.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Risk Matrix */}
          {anomalies.length > 0 && (
            <RiskMatrix anomalies={anomalies} onCellClick={handleCellClick} />
          )}

          {/* Department Health Grades */}
          {anomalies.length > 0 && (
            <DepartmentHealthGrades anomalies={anomalies} />
          )}

          {/* Grouped anomaly sections */}
          {anomalies.length > 0 && (
            <div className="space-y-8">
              {/* HIGH */}
              {highAnomalies.length > 0 && (
                <section ref={highRef} aria-label="High priority anomalies">
                  <SeveritySectionHeader severity="high" count={highAnomalies.length} />
                  <div className="mt-3 space-y-4">
                    {highAnomalies.map((anomaly, i) => (
                      <AnomalyCard key={`high-${anomaly.type}-${i}`} anomaly={anomaly} />
                    ))}
                  </div>
                </section>
              )}

              {/* MEDIUM */}
              {medAnomalies.length > 0 && (
                <section ref={medRef} aria-label="Medium priority anomalies">
                  <SeveritySectionHeader severity="medium" count={medAnomalies.length} />
                  <div className="mt-3 space-y-4">
                    {medAnomalies.map((anomaly, i) => (
                      <AnomalyCard key={`med-${anomaly.type}-${i}`} anomaly={anomaly} />
                    ))}
                  </div>
                </section>
              )}

              {/* LOW */}
              {lowAnomalies.length > 0 && (
                <section ref={lowRef} aria-label="Low priority anomalies">
                  <SeveritySectionHeader severity="low" count={lowAnomalies.length} />
                  <div className="mt-3 space-y-4">
                    {lowAnomalies.map((anomaly, i) => (
                      <AnomalyCard key={`low-${anomaly.type}-${i}`} anomaly={anomaly} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
