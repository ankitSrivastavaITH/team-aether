"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeptVendorEntry {
  department: string;
  supplier: string;
  vendor_total: number;
  dept_total: number;
  share_pct: number;
}

interface OverallHHI {
  hhi_index: number;
  unique_vendors: number;
}

interface ConcentratedDept {
  department: string;
  max_vendor_share: number;
  top_vendor: string;
  vendor_count: number;
}

interface ConcentrationRiskData {
  high_concentration_vendors: DeptVendorEntry[];
  overall_hhi: OverallHHI;
  concentrated_departments: ConcentratedDept[];
  methodology: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function getHHILevel(hhi: number): {
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  Icon: React.ElementType;
  description: string;
} {
  if (hhi < 1500) {
    return {
      label: "Low concentration",
      color: "#059669",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      Icon: CheckCircle,
      description:
        "Many vendors share city contracts. Competition appears healthy.",
    };
  }
  if (hhi <= 2500) {
    return {
      label: "Moderate concentration",
      color: "#d97706",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      Icon: AlertTriangle,
      description:
        "A smaller number of vendors hold a larger share. Some departments may warrant closer review.",
    };
  }
  return {
    label: "High concentration",
    color: "#dc2626",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    Icon: AlertTriangle,
    description:
      "A few vendors dominate city spending. This may reduce competitive pricing and increase dependency risk.",
  };
}

function getShareColor(share: number): string {
  if (share >= 75) return "#dc2626";
  if (share >= 50) return "#d97706";
  return "#2563eb";
}

function getShareLabel(share: number): string {
  if (share >= 75) return "Very high";
  if (share >= 50) return "High";
  return "Elevated";
}

// Custom tooltip for bar chart
function ConcentrationTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-md text-slate-800 text-sm"
    >
      <p className="font-semibold">{label}</p>
      <p>{payload[0].value.toFixed(1)}% of dept. spending</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ConcentrationRisk() {
  const { data, isLoading, isError } = useQuery<ConcentrationRiskData>({
    queryKey: ["concentration-risk"],
    queryFn: () => fetchAPI<ConcentrationRiskData>("/api/contracts/concentration-risk"),
  });

  if (isLoading) {
    return (
      <section
        aria-label="Vendor Concentration Analysis"
        aria-busy="true"
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-slate-400" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-slate-800">
            Vendor Concentration Analysis
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-100 rounded-xl h-48 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section aria-label="Vendor Concentration Analysis">
        <div
          role="alert"
          className="rounded-xl ring-1 ring-red-200 bg-red-50 p-6 text-red-700 text-base"
        >
          Unable to load concentration risk data. Please try again later.
        </div>
      </section>
    );
  }

  const { high_concentration_vendors, overall_hhi, concentrated_departments, methodology } =
    data;

  const hhiLevel = getHHILevel(overall_hhi.hhi_index);
  const HHIIcon = hhiLevel.Icon;

  // Prepare chart data — top 10 concentrated departments
  const chartData = concentrated_departments
    .slice(0, 10)
    .map((d) => ({
      department:
        d.department.length > 24
          ? d.department.slice(0, 23) + "…"
          : d.department,
      fullDepartment: d.department,
      share: parseFloat(d.max_vendor_share.toFixed(1)),
      top_vendor: d.top_vendor,
    }))
    .sort((a, b) => a.share - b.share); // ascending for horizontal bar (recharts renders bottom-to-top)

  return (
    <section
      role="region"
      aria-label="Vendor Concentration Analysis"
      className="space-y-6"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-slate-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-slate-800">
          Vendor Concentration Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* HHI Score Card */}
        <Card className={`${hhiLevel.bgColor} border-0 ring-1 ring-inset ring-slate-200`}>
          <CardHeader className="pb-2">
            <CardTitle>
              <h3 className="text-base font-semibold text-slate-700">
                Overall Market Concentration (HHI)
              </h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <HHIIcon
                className={`h-5 w-5 ${hhiLevel.textColor} shrink-0`}
                aria-hidden="true"
              />
              <span className={`text-3xl font-bold ${hhiLevel.textColor}`}>
                {overall_hhi.hhi_index.toLocaleString()}
              </span>
            </div>
            <p className={`text-sm font-medium ${hhiLevel.textColor}`}>
              {hhiLevel.label}
            </p>
            <p className="text-sm text-slate-600">{hhiLevel.description}</p>
            <dl className="text-sm text-slate-600">
              <dt className="inline font-medium">Unique vendors:</dt>{" "}
              <dd className="inline">{overall_hhi.unique_vendors.toLocaleString()}</dd>
            </dl>
            <div
              className="text-xs text-slate-500 border-t border-slate-200 pt-2 space-y-1"
              aria-label="HHI scale reference"
            >
              <p className="font-medium">HHI scale:</p>
              <ul className="space-y-0.5 list-none">
                <li>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" aria-hidden="true" />
                  Below 1,500 — Low (healthy competition)
                </li>
                <li>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" aria-hidden="true" />
                  1,500–2,500 — Moderate
                </li>
                <li>
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" aria-hidden="true" />
                  Above 2,500 — High
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Concentrated Departments Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>
              <h3 className="text-base font-semibold text-slate-700">
                Departments with High Single-Vendor Share (&gt;30%)
              </h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No departments with a single vendor holding &gt;30% of spending.
              </p>
            ) : (
              <div
                role="img"
                aria-label={`Bar chart showing top-vendor share by department. ${chartData[chartData.length - 1]?.fullDepartment ?? ""} has the highest single-vendor concentration at ${chartData[chartData.length - 1]?.share ?? ""}%.`}
                style={{ height: Math.max(200, chartData.length * 36 + 40) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 56, bottom: 4, left: 4 }}
                    aria-hidden="true"
                  >
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="department"
                      width={180}
                      tick={{ fontSize: 12, fill: "#1e293b" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <Tooltip
                      content={<ConcentrationTooltip />}
                      cursor={{ fill: "#EFF6FF" }}
                      wrapperStyle={{ outline: "none" }}
                    />
                    <Bar
                      dataKey="share"
                      name="Top vendor share"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getShareColor(entry.share)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Concentrated Departments Table */}
      {concentrated_departments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <h3 className="text-base font-semibold text-slate-700">
                Department Breakdown — Top Vendor &gt;30% of Spending
              </h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Departments with high single-vendor concentration">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="text-left py-2 pr-4 font-medium text-slate-600">
                    Department
                  </th>
                  <th scope="col" className="text-left py-2 pr-4 font-medium text-slate-600">
                    Top Vendor
                  </th>
                  <th scope="col" className="text-right py-2 pr-4 font-medium text-slate-600">
                    Share
                  </th>
                  <th scope="col" className="text-right py-2 font-medium text-slate-600">
                    Vendors
                  </th>
                </tr>
              </thead>
              <tbody>
                {concentrated_departments.map((dept, i) => {
                  const share = parseFloat(dept.max_vendor_share.toFixed(1));
                  const shareColor = getShareColor(share);
                  const shareLabel = getShareLabel(share);
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 pr-4 text-slate-800 font-medium">
                        {dept.department}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {dept.top_vendor}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Accessible percentage bar */}
                          <div
                            className="relative h-2 w-24 bg-slate-100 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={share}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${dept.department}: ${share}% share — ${shareLabel}`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${share}%`,
                                backgroundColor: shareColor,
                              }}
                            />
                          </div>
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: shareColor }}
                          >
                            {share}%
                          </span>
                          {/* Text label for risk level — never color alone */}
                          <span className="sr-only">{shareLabel} concentration</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-600 tabular-nums">
                        {dept.vendor_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* High-share vendor cards */}
      {high_concentration_vendors.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-slate-700 mb-3">
            Vendors with &gt;25% Share in Any Department
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {high_concentration_vendors.map((entry, i) => {
              const share = parseFloat(entry.share_pct.toFixed(1));
              const shareColor = getShareColor(share);
              const shareLabel = getShareLabel(share);
              const ShareIcon =
                share >= 50 ? AlertTriangle : Info;
              return (
                <div
                  key={i}
                  className="rounded-xl ring-1 ring-slate-200 bg-white p-4 space-y-2 hover:ring-slate-300 transition-all"
                  role="article"
                  aria-label={`${entry.supplier} holds ${share}% of ${entry.department} spending`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {entry.supplier}
                    </p>
                    <ShareIcon
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: shareColor }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs text-slate-500">{entry.department}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="relative h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={share}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${share}% of department spending — ${shareLabel}`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${Math.min(share, 100)}%`,
                          backgroundColor: shareColor,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums shrink-0"
                      style={{ color: shareColor }}
                    >
                      {share}%
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: shareColor }}>
                    {shareLabel} concentration
                  </p>
                  <dl className="text-xs text-slate-500 space-y-0.5">
                    <div>
                      <dt className="inline font-medium">Vendor spend:</dt>{" "}
                      <dd className="inline">{formatCurrency(entry.vendor_total)}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Dept. total:</dt>{" "}
                      <dd className="inline">{formatCurrency(entry.dept_total)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Methodology note */}
      <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span className="font-medium">Methodology:</span> {methodology}
      </p>
    </section>
  );
}
