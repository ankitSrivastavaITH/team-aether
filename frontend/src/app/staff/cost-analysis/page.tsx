"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Loader2,
  Info,
  ArrowRight,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useDepartments } from "@/hooks/use-contracts";
import { VendorSelect } from "@/components/vendor-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface CostComparisonData {
  department: string;
  vendors: Array<{
    supplier: string;
    count: number;
    avg_value: number;
    total_value: number;
    min_value: number;
    max_value: number;
  }>;
  department_average: number;
}

// ---------------------------------------------------------------------------
// Tooltip components
// ---------------------------------------------------------------------------

function PriceTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { contract_number: string; description: string };
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-md text-sm max-w-xs"
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
        {payload[0].payload.contract_number}
      </p>
      {payload[0].payload.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {payload[0].payload.description}
        </p>
      )}
    </div>
  );
}

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { supplier: string; count: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 shadow-md text-sm max-w-xs"
    >
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {payload[0].payload.supplier}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Avg: {formatCurrency(payload[0].value)} ({payload[0].payload.count}{" "}
        contracts)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CostAnalysisPage() {
  const [vendorName, setVendorName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  const { data: departmentsData } = useDepartments();

  // Vendor price trend
  const {
    data: trendData,
    isLoading: trendLoading,
    isError: trendError,
  } = useQuery<PriceTrendData>({
    queryKey: ["vendor-price-trend", vendorName],
    queryFn: () =>
      fetchAPI<PriceTrendData>(
        `/api/analytics/vendor-price-trend/${encodeURIComponent(vendorName)}`
      ),
    enabled: vendorName.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Department cost comparison
  const {
    data: compData,
    isLoading: compLoading,
  } = useQuery<CostComparisonData>({
    queryKey: ["cost-comparison", selectedDept],
    queryFn: () =>
      fetchAPI<CostComparisonData>(
        `/api/analytics/cost-comparison/${encodeURIComponent(selectedDept)}`
      ),
    enabled: selectedDept.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const departmentList: string[] = Array.isArray(departmentsData)
    ? departmentsData
        .flatMap((d) => {
          if (typeof d === "string") return [d];
          if (d && typeof d === "object" && "department" in d)
            return [(d as { department: string }).department];
          return [];
        })
        .filter(Boolean)
    : [];

  // Compute average comparison text
  let avgComparison: string | null = null;
  if (
    trendData &&
    trendData.department_average &&
    trendData.latest_value &&
    trendData.department_average > 0
  ) {
    const diff = trendData.latest_value - trendData.department_average;
    const pct = Math.abs(
      Math.round((diff / trendData.department_average) * 100)
    );
    if (diff > 0) {
      avgComparison = `This vendor's latest contract is ${pct}% above the ${trendData.department} department average`;
    } else if (diff < 0) {
      avgComparison = `This vendor's latest contract is ${pct}% below the ${trendData.department} department average`;
    }
  }

  const chartData = trendData?.contracts.map((c) => ({
    date: c.start_date?.substring(0, 10) || "",
    value: c.value,
    contract_number: c.contract_number,
    description: c.description,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <TrendingUp
            className="h-7 w-7 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          Cost Analysis
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Analyze vendor pricing trends, compare costs within departments, and
          identify cost-effective procurement opportunities.
        </p>
        <a
          href="/staff/compare-vendors"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          style={{ minHeight: 44 }}
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Compare Two Vendors Side-by-Side →
        </a>
      </div>

      {/* Vendor Price Trend Section */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
              Vendor Price Trend
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <VendorSelect
              value={vendorName}
              onChange={setVendorName}
              label="Select Vendor"
            />
          </div>

          {trendLoading && (
            <div
              className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400"
              aria-busy="true"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading price data...
            </div>
          )}

          {trendError && (
            <div
              role="alert"
              className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400"
            >
              Could not load price data. Please check the vendor name and try
              again.
            </div>
          )}

          {trendData && (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Contracts
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {trendData.total_contracts}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    First Value
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(trendData.first_value)}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Latest Value
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(trendData.latest_value)}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Price Change
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {trendData.price_change_pct > 0 ? (
                      <TrendingUp
                        className="h-4 w-4 text-red-500"
                        aria-hidden="true"
                      />
                    ) : trendData.price_change_pct < 0 ? (
                      <TrendingDown
                        className="h-4 w-4 text-green-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <Minus
                        className="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                    )}
                    <p
                      className={`text-xl font-bold ${
                        trendData.price_change_pct > 0
                          ? "text-red-600 dark:text-red-400"
                          : trendData.price_change_pct < 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {trendData.price_change_pct > 0 ? "+" : ""}
                      {trendData.price_change_pct}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge */}
              {trendData.price_change_pct !== 0 && (
                <Badge
                  className={`gap-1 ${
                    trendData.price_change_pct > 0
                      ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                      : "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
                  }`}
                >
                  {trendData.price_change_pct > 0 ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  )}
                  {trendData.price_change_pct > 0 ? "Costs increasing" : "Costs decreasing"}{" "}
                  over time
                </Badge>
              )}

              {/* Average comparison */}
              {avgComparison && (
                <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Info
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {avgComparison}
                  </p>
                </div>
              )}

              {/* Chart */}
              {chartData && chartData.length > 0 && (
                <div className="h-72" aria-label="Vendor price trend chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        className="dark:opacity-20"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          v >= 1e6
                            ? `$${(v / 1e6).toFixed(1)}M`
                            : v >= 1e3
                            ? `$${(v / 1e3).toFixed(0)}K`
                            : `$${v}`
                        }
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={65}
                      />
                      <Tooltip content={<PriceTrendTooltip />} />
                      {trendData.department_average && (
                        <ReferenceLine
                          y={trendData.department_average}
                          stroke="#94a3b8"
                          strokeDasharray="6 3"
                          label={{
                            value: `Dept avg: ${formatCurrency(trendData.department_average)}`,
                            position: "insideTopRight",
                            fontSize: 11,
                            fill: "#94a3b8",
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "#2563eb" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData && chartData.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                  No price data available for this vendor.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Cost Comparison */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3
                className="h-5 w-5 text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              Department Vendor Comparison
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <label htmlFor="dept-select" className="sr-only">
              Select department
            </label>
            <Select
              value={selectedDept}
              onValueChange={(v) => setSelectedDept(v ?? "")}
            >
              <SelectTrigger
                id="dept-select"
                aria-label="Select department to compare"
                className="h-11 text-base"
              >
                <SelectValue placeholder="Select a department..." />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {compLoading && (
            <div
              className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400"
              aria-busy="true"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading comparison data...
            </div>
          )}

          {compData && compData.vendors.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing vendors in <span className="font-medium">{compData.department}</span>{" "}
                with 2+ contracts. Department average:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(compData.department_average)}
                </span>
              </p>

              <div className="h-80" aria-label="Vendor cost comparison chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={compData.vendors.map((v) => ({
                      supplier:
                        v.supplier.length > 20
                          ? v.supplier.substring(0, 20) + "..."
                          : v.supplier,
                      avg_value: v.avg_value,
                      count: v.count,
                    }))}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      className="dark:opacity-20"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) =>
                        v >= 1e6
                          ? `$${(v / 1e6).toFixed(1)}M`
                          : v >= 1e3
                          ? `$${(v / 1e3).toFixed(0)}K`
                          : `$${v}`
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="supplier"
                      type="category"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<ComparisonTooltip />} />
                    {compData.department_average && (
                      <ReferenceLine
                        x={compData.department_average}
                        stroke="#94a3b8"
                        strokeDasharray="6 3"
                        label={{
                          value: "Dept avg",
                          position: "top",
                          fontSize: 10,
                          fill: "#94a3b8",
                        }}
                      />
                    )}
                    <Bar dataKey="avg_value" radius={[0, 4, 4, 0]}>
                      {compData.vendors.map((v, i) => (
                        <Cell
                          key={i}
                          fill={
                            v.avg_value > compData.department_average
                              ? "#ef4444"
                              : "#22c55e"
                          }
                          fillOpacity={0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto">
                <table
                  className="w-full text-sm"
                  role="table"
                  aria-label="Vendor cost comparison"
                >
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Vendor
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Contracts
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Avg Value
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100"
                      >
                        vs Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compData.vendors.map((v, i) => {
                      const diff =
                        compData.department_average > 0
                          ? Math.round(
                              ((v.avg_value - compData.department_average) /
                                compData.department_average) *
                                100
                            )
                          : 0;
                      return (
                        <tr
                          key={v.supplier}
                          className={
                            i % 2 === 0
                              ? "bg-white dark:bg-slate-800"
                              : "bg-slate-50 dark:bg-slate-900"
                          }
                        >
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                            {v.supplier}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                            {v.count}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(v.avg_value)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                            {formatCurrency(v.total_value)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-medium ${
                                diff > 0
                                  ? "text-red-600 dark:text-red-400"
                                  : diff < 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {diff > 0 ? (
                                <ArrowRight
                                  className="h-3 w-3 rotate-[-45deg]"
                                  aria-hidden="true"
                                />
                              ) : diff < 0 ? (
                                <ArrowRight
                                  className="h-3 w-3 rotate-[45deg]"
                                  aria-hidden="true"
                                />
                              ) : null}
                              {diff > 0 ? "+" : ""}
                              {diff}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {compData && compData.vendors.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              No vendors with 2+ contracts found in this department.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
