"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Users,
  Info,
  TrendingUp,
  Building2,
  ShoppingCart,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmallBusinessContracts {
  count: number;
  total_value: number;
}

interface DeptDiversityRow {
  department: string;
  unique_vendors: number;
  total_contracts: number;
  diversity_ratio: number;
}

interface ProcurementTypeRow {
  procurement_type: string;
  count: number;
  total_value: number;
  pct_value: number;
}

interface CompetitiveBidding {
  count: number;
  total_value: number;
}

interface MBEAnalysisData {
  small_business_contracts: SmallBusinessContracts;
  all_contracts: SmallBusinessContracts;
  department_diversity: DeptDiversityRow[];
  single_contract_vendors: number;
  total_unique_vendors: number;
  procurement_types: ProcurementTypeRow[];
  competitive_bidding: CompetitiveBidding;
  insights: string[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-2 rounded-lg ${iconColor}`}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {value}
            </p>
            {sub && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sub}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pie chart custom tooltip
// ---------------------------------------------------------------------------

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { pct_value: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-md text-sm"
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {entry.name}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        {entry.value.toLocaleString()} contracts
      </p>
      <p className="text-slate-500 dark:text-slate-400">
        {entry.payload.pct_value}% of spend
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diversity Bar Tooltip
// ---------------------------------------------------------------------------

function DiversityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-md text-sm max-w-[220px]"
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-600 dark:text-slate-300">
          {entry.name}: {entry.value}
          {entry.name === "Diversity Ratio" ? "%" : ""}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PIE_COLORS = [
  "#2563EB",
  "#7c3aed",
  "#0891b2",
  "#d97706",
  "#059669",
  "#dc2626",
  "#6d28d9",
  "#b45309",
];

export default function MBEAnalysisPage() {
  const { data, isLoading, isError } = useQuery<MBEAnalysisData>({
    queryKey: ["mbe-analysis"],
    queryFn: () => fetchAPI<MBEAnalysisData>("/api/mbe/analysis"),
    staleTime: 10 * 60 * 1000,
  });

  const smallCount = data?.small_business_contracts?.count ?? 0;
  const allCount = data?.all_contracts?.count ?? 0;
  const smallValue = data?.small_business_contracts?.total_value ?? 0;
  const totalUniqueVendors = data?.total_unique_vendors ?? 0;
  const singleVendors = data?.single_contract_vendors ?? 0;
  const competitiveCount = data?.competitive_bidding?.count ?? 0;
  const allCountForCompetitive = data?.all_contracts?.count ?? 0;

  const deptRows = (data?.department_diversity ?? []).map((r) => ({
    ...r,
    label:
      r.department.length > 24
        ? r.department.slice(0, 22) + "…"
        : r.department,
  }));

  const pieData = (data?.procurement_types ?? []).slice(0, 8).map((r) => ({
    name: r.procurement_type,
    value: r.count,
    pct_value: r.pct_value,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          MBE &amp; Supplier Diversity Analysis
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Patterns relevant to minority and small business participation in
          Richmond city contracts.
        </p>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-semibold">Data note: </span>
              {data?.disclaimer ??
                "MBE status cannot be determined from public contract data alone. This analysis identifies patterns relevant to supplier diversity."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
              aria-busy="true"
              aria-label="Loading stat card"
            />
          ))}
        </div>
      )}
      {isError && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm"
        >
          Unable to load MBE analysis data. Please try again later.
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="mbe-stats">
            <StatCard
              icon={ShoppingCart}
              iconColor="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              label="Small Contracts (under $500K)"
              value={smallCount.toLocaleString()}
              sub={`${pct(smallCount, allCount)} of all contracts`}
            />
            <StatCard
              icon={TrendingUp}
              iconColor="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
              label="Small Contract Value"
              value={formatCurrency(smallValue)}
              sub="Under $500K threshold"
            />
            <StatCard
              icon={Users}
              iconColor="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
              label="Single-Contract Vendors"
              value={singleVendors.toLocaleString()}
              sub={`${pct(singleVendors, totalUniqueVendors)} of ${totalUniqueVendors.toLocaleString()} total vendors`}
            />
            <StatCard
              icon={Building2}
              iconColor="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
              label="Competitively Bid Contracts"
              value={competitiveCount.toLocaleString()}
              sub={`${pct(competitiveCount, allCountForCompetitive)} via Invitation to Bid`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Diversity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Lowest Vendor Diversity by Department
                  </h2>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Departments with the fewest unique vendors relative to
                  contracts — potential areas for broader outreach.
                </p>
              </CardHeader>
              <CardContent>
                {deptRows.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No data available.
                  </p>
                ) : (
                  <div
                    role="img"
                    aria-label={`Horizontal bar chart showing vendor diversity ratio for the 10 departments with lowest diversity. Lowest is ${deptRows[0]?.department} at ${deptRows[0]?.diversity_ratio}%.`}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={deptRows}
                        layout="vertical"
                        margin={{ top: 4, right: 48, bottom: 4, left: 160 }}
                        aria-hidden="true"
                      >
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={152}
                          tick={{ fontSize: 11, fill: "#1e293b" }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                        />
                        <Tooltip
                          content={<DiversityTooltip />}
                          wrapperStyle={{ outline: "none" }}
                          cursor={{ fill: "#EFF6FF" }}
                        />
                        <Bar
                          dataKey="diversity_ratio"
                          name="Diversity Ratio"
                          radius={[0, 4, 4, 0]}
                        >
                          {deptRows.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`rgba(37, 99, 235, ${0.35 + (index / (deptRows.length - 1 || 1)) * 0.65})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procurement Type Pie */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Contracts by Procurement Method
                  </h2>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Competitive methods (Invitation to Bid) are most accessible
                  to new and small vendors.
                </p>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No data available.
                  </p>
                ) : (
                  <div
                    role="img"
                    aria-label={`Pie chart showing procurement method breakdown. ${pieData[0]?.name} has the most contracts at ${pieData[0]?.value?.toLocaleString()}.`}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart aria-hidden="true">
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<PieTooltip />}
                          wrapperStyle={{ outline: "none" }}
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {value}
                            </span>
                          )}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card data-tour="mbe-insights">
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lightbulb
                    className="h-5 w-5 text-amber-500"
                    aria-hidden="true"
                  />
                  Supplier Diversity Insights
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3" aria-label="Supplier diversity insights">
                {(data.insights ?? []).map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Info
                      className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {insight}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
