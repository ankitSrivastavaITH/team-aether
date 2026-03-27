"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ArrowLeft, FileText, DollarSign, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { DataBadge } from "@/components/data-badge";
import { fetchAPI } from "@/lib/api";
import { formatCurrency, formatDate, riskColor, riskLabel } from "@/lib/utils";

// ---- Types ----------------------------------------------------------------

interface ContractRow {
  department: string;
  contract_number: string;
  value: number;
  supplier: string;
  procurement_type: string;
  description: string;
  solicitation_type: string;
  start_date: string | null;
  end_date: string | null;
  days_to_expiry: number | null;
  risk_level: string;
}

interface VendorEntry {
  supplier: string;
  count: number;
  total_value: number;
}

interface RiskEntry {
  risk_level: string;
  count: number;
}

interface YearEntry {
  year: number;
  count: number;
  total_value: number;
}

interface DeptStats {
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_60: number;
  expired_count: number;
}

interface DepartmentData {
  department: string;
  contracts: ContractRow[];
  stats: DeptStats;
  top_vendors: VendorEntry[];
  risk_breakdown: RiskEntry[];
  yearly_spending: YearEntry[];
}

// ---- Helpers ---------------------------------------------------------------

function currencyTick(value: unknown) {
  const v = typeof value === "number" ? value : Number(value);
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// Accessible color palette for risk levels (WCAG AA on white)
const RISK_COLORS: Record<string, string> = {
  critical: "#dc2626",  // red-600
  warning:  "#d97706",  // amber-600
  attention: "#ea580c", // orange-600
  ok:       "#16a34a",  // green-600
  expired:  "#64748b",  // slate-500
  unknown:  "#94a3b8",  // slate-400
};

const VENDOR_COLORS = [
  "#2563eb", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#4f46e5", "#be185d",
  "#0f766e", "#b45309",
];

// ---- Sub-components --------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  textClass = "text-[#1E293B]",
  bgClass = "bg-white",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  textClass?: string;
  bgClass?: string;
}) {
  return (
    <Card className={`${bgClass} border border-[#E2E8F0] shadow-sm`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 text-sm text-[#475569] mb-1">
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{label}</span>
        </div>
        <div className={`text-2xl font-bold ${textClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for area chart
function AreaTooltip({
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
      className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-md text-[#1E293B] text-sm"
    >
      <p className="font-semibold">{label}</p>
      <p>{currencyTick(payload[0].value)}</p>
    </div>
  );
}

// Custom tooltip for pie chart
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-md text-[#1E293B] text-sm"
    >
      <p className="font-semibold capitalize">{riskLabel(payload[0].name)}</p>
      <p>{payload[0].value} contracts</p>
    </div>
  );
}

function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ---- Main page -------------------------------------------------------------

export default function DepartmentDetailPage() {
  const params = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(params.name);
  const reducedMotion = useReducedMotion();

  const { data, isLoading, error } = useQuery({
    queryKey: ["department", decodedName],
    queryFn: () =>
      fetchAPI<DepartmentData>(
        `/api/contracts/departments/${encodeURIComponent(decodedName)}`
      ),
  });

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading department details"
        className="space-y-6"
      >
        <div className="h-12 w-1/3 bg-[#E2E8F0] animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#E2E8F0] animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-[#E2E8F0] animate-pulse rounded-xl" />
          <div className="h-72 bg-[#E2E8F0] animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="py-12 text-center text-lg text-red-600">
        Could not load department details. Please try again later.
      </div>
    );
  }

  const s = data.stats;
  const riskData = data.risk_breakdown.map((r) => ({
    name: r.risk_level,
    value: r.count,
  }));

  const yearData = data.yearly_spending.map((y) => ({
    year: String(Math.round(y.year)),
    total_value: y.total_value,
    count: y.count,
  }));

  const topVendorAriaLabel =
    data.top_vendors.length > 0
      ? `Top vendor is ${data.top_vendors[0].supplier} with ${formatCurrency(data.top_vendors[0].total_value)}.`
      : "No vendor data.";

  const riskAriaLabel =
    riskData.length > 0
      ? `Risk breakdown for ${decodedName}. ${riskData.map((r) => `${riskLabel(r.name)}: ${r.value}`).join(", ")}.`
      : "No risk data.";

  const trendAriaLabel =
    yearData.length > 0
      ? `Yearly spending trend for ${decodedName} from ${yearData[0].year} to ${yearData[yearData.length - 1].year}.`
      : "No yearly spending data.";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B]">{decodedName}</h1>
          <div className="flex gap-2 mt-2">
            <DataBadge />
          </div>
        </div>
        <Link href="/public">
          <Button
            variant="outline"
            className="h-11 gap-2 focus:ring-[3px] focus:ring-[#2563EB] focus:ring-offset-2"
            aria-label="Back to transparency overview"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Overview
          </Button>
        </Link>
      </div>

      <Disclaimer />

      {/* Stats cards */}
      <section aria-label="Department statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Contracts"
            value={(s.total_contracts ?? 0).toLocaleString()}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            label="Total Value"
            value={formatCurrency(s.total_value)}
            icon={<DollarSign className="h-4 w-4" />}
            textClass="text-[#2563EB]"
          />
          <StatCard
            label="Expiring in 30 Days"
            value={(s.expiring_30 ?? 0).toLocaleString()}
            icon={<AlertTriangle className="h-4 w-4" />}
            textClass={s.expiring_30 > 0 ? "text-[#d97706]" : "text-[#1E293B]"}
            bgClass={s.expiring_30 > 0 ? "bg-amber-50" : "bg-white"}
          />
          <StatCard
            label="Expired"
            value={(s.expired_count ?? 0).toLocaleString()}
            icon={<AlertCircle className="h-4 w-4" />}
            textClass={s.expired_count > 0 ? "text-[#dc2626]" : "text-[#1E293B]"}
            bgClass={s.expired_count > 0 ? "bg-red-50" : "bg-white"}
          />
        </div>
      </section>

      {/* Charts: risk breakdown + yearly spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl font-bold text-[#1E293B]">Risk Breakdown</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label={riskAriaLabel} style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart aria-hidden="true">
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius="35%"
                    outerRadius="60%"
                    paddingAngle={2}
                    isAnimationActive={!reducedMotion}
                  >
                    {riskData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[entry.name] ?? "#94a3b8"}
                        aria-label={`${riskLabel(entry.name)}: ${entry.value} contracts`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<PieTooltip />}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value: string) => (
                      <span style={{ fontSize: 13, color: "#1E293B" }}>
                        {riskLabel(value)}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Spending Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-xl font-bold text-[#1E293B]">Spending Over Time</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {yearData.length === 0 ? (
              <p className="text-[#475569] text-sm py-8 text-center">
                No yearly spending data available.
              </p>
            ) : (
              <div role="img" aria-label={trendAriaLabel} style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={yearData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={currencyTick}
                      tick={{ fontSize: 12, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      content={<AreaTooltip />}
                      wrapperStyle={{ outline: "none" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_value"
                      name="Total Value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#spendGradient)"
                      dot={{ fill: "#2563eb", r: 3 }}
                      activeDot={{ r: 5, fill: "#2563eb" }}
                      isAnimationActive={!reducedMotion}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Vendors */}
      <section aria-labelledby="vendors-heading">
        <h2 id="vendors-heading" className="text-xl font-bold text-[#1E293B] mb-4">
          Top 10 Vendors
        </h2>
        {data.top_vendors.length === 0 ? (
          <p className="text-[#475569]">No vendor data available.</p>
        ) : (
          <div
            role="img"
            aria-label={topVendorAriaLabel}
            className="sr-only"
          />
        )}
        {data.top_vendors.length > 0 && (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 list-none p-0"
            aria-label="Top vendors by contract value"
          >
            {data.top_vendors.map((vendor, index) => (
              <li key={vendor.supplier}>
                <Link
                  href={`/public/vendor/${encodeURIComponent(vendor.supplier)}`}
                  className="group block rounded-xl bg-white border border-[#E2E8F0] p-4 transition-all duration-150 hover:border-[#2563EB] hover:shadow-md focus:outline-none focus:ring-[3px] focus:ring-[#2563EB] focus:ring-offset-2 min-h-[44px]"
                  aria-label={`View contracts for ${vendor.supplier}: ${vendor.count} contracts worth ${formatCurrency(vendor.total_value)}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: VENDOR_COLORS[index % VENDOR_COLORS.length] }}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <p className="font-semibold text-sm text-[#1E293B] group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-2" aria-hidden="true">
                      {vendor.supplier}
                    </p>
                  </div>
                  <div className="text-sm text-[#475569] space-y-0.5" aria-hidden="true">
                    <div className="font-bold text-base text-[#1E293B]">
                      {formatCurrency(vendor.total_value)}
                    </div>
                    <div>{vendor.count} {vendor.count === 1 ? "contract" : "contracts"}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Full Contracts Table */}
      <section aria-labelledby="contracts-heading">
        <h2 id="contracts-heading" className="text-xl font-bold text-[#1E293B] mb-4">
          All Contracts ({data.contracts.length.toLocaleString()})
        </h2>
        {data.contracts.length === 0 ? (
          <p className="text-[#475569]">No contracts found for this department.</p>
        ) : (
          <div className="border border-[#E2E8F0] rounded-lg overflow-auto">
            <table
              className="w-full text-sm"
              role="table"
              aria-label={`All contracts for ${decodedName}`}
            >
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Contract #
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Supplier
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Value
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Start
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Expires
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[#1E293B]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((c, i) => (
                  <tr
                    key={c.contract_number || i}
                    className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#475569]">
                      {c.contract_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#1E293B]">
                      <Link
                        href={`/public/vendor/${encodeURIComponent(c.supplier)}`}
                        className="hover:text-[#2563EB] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 rounded"
                        aria-label={`View vendor ${c.supplier}`}
                      >
                        {c.supplier}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1E293B]">
                      {formatCurrency(c.value)}
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      {formatDate(c.start_date)}
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      {formatDate(c.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskColor(c.risk_level)}`}
                      >
                        {riskLabel(c.risk_level)}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 max-w-[280px] truncate text-[#475569]"
                      title={c.description}
                    >
                      {c.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
        <Disclaimer />
        <DataBadge />
      </div>
    </div>
  );
}
