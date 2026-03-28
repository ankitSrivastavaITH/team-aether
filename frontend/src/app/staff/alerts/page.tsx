"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Printer, AlertTriangle, Calendar, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contract {
  id?: string;
  contract_number?: string;
  supplier?: string;
  department?: string;
  value?: number;
  days_to_expiry?: number;
  end_date?: string;
  [key: string]: unknown;
}

interface ContractsResponse {
  contracts: Contract[];
  total: number;
}

interface ContractStats {
  total_contracts: number;
  total_value: number;
  expiring_soon: number;
  by_department?: Record<string, number>;
  [key: string]: unknown;
}

interface Anomaly {
  type: string;
  severity: string;
  title: string;
  count: number;
}

interface AnomalyData {
  anomalies: Anomaly[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return { start: fmt(monday), end: fmt(sunday) };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Section components (for print-friendly email template)
// ---------------------------------------------------------------------------

function EmailHeader({ weekStart, weekEnd }: { weekStart: string; weekEnd: string }) {
  return (
    <div className="bg-blue-700 dark:bg-blue-800 text-white rounded-t-xl px-8 py-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold">RVA Contract Lens — Weekly Risk Digest</h2>
          <p className="text-blue-200 text-sm mt-0.5">
            Week of {weekStart} – {weekEnd}
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpiringThisWeek({ contracts }: { contracts: Contract[] }) {
  const top5 = contracts.slice(0, 5);

  return (
    <section className="px-8 py-5 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Contracts Expiring This Week
        </h3>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {contracts.length} total
        </span>
      </div>

      {top5.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          No contracts expiring this week.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Contracts expiring this week">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th scope="col" className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Vendor
                </th>
                <th scope="col" className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Department
                </th>
                <th scope="col" className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Value
                </th>
                <th scope="col" className="text-right py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody>
              {top5.map((c, i) => (
                <tr
                  key={c.id ?? c.contract_number ?? i}
                  className="border-b border-slate-50 dark:border-slate-800/50"
                >
                  <td className="py-2 text-slate-900 dark:text-slate-100 font-medium">
                    {c.supplier ?? "—"}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {c.department ?? "—"}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(c.value ?? 0)}
                  </td>
                  <td className="py-2 text-right text-red-600 dark:text-red-400">
                    {formatDate(c.end_date as string)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length > 5 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              +{contracts.length - 5} more contracts expiring this week not shown.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ExpiringNextMonth({ stats }: { stats: ContractStats | undefined }) {
  const byDept = stats?.by_department ?? {};
  const deptEntries = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <section className="px-8 py-5 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Contracts Expiring Next Month
        </h3>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {stats?.expiring_soon ?? 0} contracts (≤30 days)
        </span>
      </div>

      {deptEntries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          No breakdown data available.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {deptEntries.map(([dept, count]) => (
            <div
              key={dept}
              className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2"
            >
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate mr-2">
                {dept}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AnomaliesSection({ anomalyData }: { anomalyData: AnomalyData | undefined }) {
  const total = anomalyData?.total ?? anomalyData?.anomalies?.length ?? 0;
  const high = anomalyData?.anomalies?.filter((a) => a.severity === "high").length ?? 0;
  const medium = anomalyData?.anomalies?.filter((a) => a.severity === "medium").length ?? 0;

  return (
    <section className="px-8 py-5 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          New Anomalies Detected
        </h3>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">Total patterns flagged</span>
        </div>
        {high > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <span className="text-2xl font-bold text-red-700 dark:text-red-400">{high}</span>
            <span className="text-sm text-red-600 dark:text-red-400">High severity</span>
          </div>
        )}
        {medium > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{medium}</span>
            <span className="text-sm text-amber-600 dark:text-amber-400">Medium severity</span>
          </div>
        )}
      </div>

      {total === 0 && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
          No anomalies detected this week.
        </p>
      )}
    </section>
  );
}

function EmailFooter() {
  return (
    <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        This is an automated report from{" "}
        <span className="font-medium text-slate-500 dark:text-slate-400">RVA Contract Lens</span>
        . Data sourced from City of Richmond Open Data (Socrata). Not official
        City financial reporting.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const { data: expiringThisWeek, isLoading: loadingWeek } = useQuery<ContractsResponse>({
    queryKey: ["alerts-expiring-week"],
    queryFn: () => fetchAPI<ContractsResponse>("/api/contracts", { max_days: 7, limit: 20 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats, isLoading: loadingStats } = useQuery<ContractStats>({
    queryKey: ["alerts-stats"],
    queryFn: () => fetchAPI<ContractStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: anomalyData, isLoading: loadingAnomalies } = useQuery<AnomalyData>({
    queryKey: ["alerts-anomalies"],
    queryFn: () => fetchAPI<AnomalyData>("/api/mbe/anomalies"),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingWeek || loadingStats || loadingAnomalies;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header (outside the email template) */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            Email Alert Preview
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            Preview of the weekly risk digest email that would be sent to staff. Use the button to download or print.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          className="h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500"
          aria-label="Download or print email template"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Download / Print
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label="Loading alert data"
        >
          <div className="h-24 bg-blue-100 dark:bg-blue-900/30 animate-pulse rounded-t-xl" />
          <div className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </div>
      )}

      {/* Email template */}
      {!isLoading && (
        <div
          id="email-template"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden"
          role="region"
          aria-label="Weekly risk digest email template"
        >
          <EmailHeader weekStart={weekStart} weekEnd={weekEnd} />
          <ExpiringThisWeek contracts={expiringThisWeek?.contracts ?? []} />
          <ExpiringNextMonth stats={stats} />
          <AnomaliesSection anomalyData={anomalyData} />
          <EmailFooter />
        </div>
      )}
    </div>
  );
}
