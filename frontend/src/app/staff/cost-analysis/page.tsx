"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { VendorSelect } from "@/components/vendor-select";
import { DepartmentChartFilter } from "@/components/chart-filter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
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
// Main Page
// ---------------------------------------------------------------------------

const VENDOR_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316",
];

export default function CostAnalysisPage() {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [currentPicker, setCurrentPicker] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  // Fetch trend data for ALL selected vendors in parallel
  const trendQueries = useQueries({
    queries: selectedVendors.map((vendor) => ({
      queryKey: ["vendor-price-trend", vendor],
      queryFn: () =>
        fetchAPI<PriceTrendData>(
          `/api/analytics/vendor-price-trend/${encodeURIComponent(vendor)}`
        ),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const anyTrendLoading = trendQueries.some((q) => q.isLoading);

  // Department cost comparison — parallel queries for all selected depts
  const deptQueries = useQueries({
    queries: selectedDepts.map((dept) => ({
      queryKey: ["cost-comparison", dept],
      queryFn: () =>
        fetchAPI<CostComparisonData>(
          `/api/analytics/cost-comparison/${encodeURIComponent(dept)}`
        ),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const anyDeptLoading = deptQueries.some((q) => q.isLoading);

  function handleAddVendor(vendor: string) {
    if (vendor && !selectedVendors.includes(vendor)) {
      setSelectedVendors((prev) => [...prev, vendor]);
    }
    setCurrentPicker("");
  }

  function handleRemoveVendor(vendor: string) {
    setSelectedVendors((prev) => prev.filter((v) => v !== vendor));
  }

  // Build merged chart data: all dates on X axis, each vendor as a separate key
  const mergedChart: Record<string, unknown>[] = [];
  const dateMap = new Map<string, Record<string, unknown>>();

  trendQueries.forEach((q, idx) => {
    if (!q.data) return;
    const vendor = selectedVendors[idx];
    for (const c of q.data.contracts) {
      const date = c.start_date?.substring(0, 10) || "";
      if (!dateMap.has(date)) {
        dateMap.set(date, { date });
      }
      dateMap.get(date)![vendor] = c.value;
    }
  });

  // Sort by date
  const sortedDates = Array.from(dateMap.keys()).sort();
  for (const d of sortedDates) {
    mergedChart.push(dateMap.get(d)!);
  }

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
          {/* Vendor picker — adds to multi-select list */}
          <div className="max-w-sm">
            <VendorSelect
              value={currentPicker}
              onChange={handleAddVendor}
              label="Add Vendor to Compare"
            />
          </div>

          {/* Selected vendor chips */}
          {selectedVendors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedVendors.map((v, i) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: VENDOR_COLORS[i % VENDOR_COLORS.length] }}
                >
                  <span className="max-w-[180px] truncate">{v}</span>
                  <button
                    onClick={() => handleRemoveVendor(v)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                    aria-label={`Remove ${v}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedVendors.length > 1 && (
                <button
                  onClick={() => setSelectedVendors([])}
                  className="text-xs text-slate-500 hover:text-red-500 px-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {anyTrendLoading && (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading price data...
            </div>
          )}

          {/* Per-vendor stat cards */}
          {trendQueries.filter((q) => q.data).length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {trendQueries.map((q, idx) => {
                  if (!q.data) return null;
                  const d = q.data;
                  const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
                  return (
                    <div key={selectedVendors[idx]} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4" style={{ borderLeftColor: color }}>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{d.supplier}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{d.total_contracts} contracts</span>
                        <span className={`text-sm font-bold ${d.price_change_pct > 0 ? "text-red-600 dark:text-red-400" : d.price_change_pct < 0 ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}`}>
                          {d.price_change_pct > 0 ? "+" : ""}{d.price_change_pct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-400 dark:text-slate-500">
                        <span>{formatCurrency(d.first_value)} → {formatCurrency(d.latest_value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overlaid multi-vendor chart */}
              {mergedChart.length > 0 && (
                <div className="h-80" aria-label="Multi-vendor price trend comparison chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mergedChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                      />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), String(name)]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {selectedVendors.map((vendor, idx) => (
                        <Line
                          key={vendor}
                          type="monotone"
                          dataKey={vendor}
                          stroke={VENDOR_COLORS[idx % VENDOR_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: VENDOR_COLORS[idx % VENDOR_COLORS.length] }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {selectedVendors.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  Select vendors above to compare their price trends.
                </p>
              )}
            </div>
          )}

          {selectedVendors.length === 0 && !anyTrendLoading && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select one or more vendors to compare price trends over time</p>
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
          <DepartmentChartFilter
            selected={selectedDepts}
            onChange={setSelectedDepts}
          />

          {/* Selected department chips */}
          {selectedDepts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedDepts.map((d, i) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: VENDOR_COLORS[i % VENDOR_COLORS.length] }}
                >
                  <span className="max-w-[180px] truncate">{d}</span>
                  <button
                    onClick={() => setSelectedDepts((prev) => prev.filter((x) => x !== d))}
                    className="hover:bg-white/20 rounded-full p-0.5"
                    aria-label={`Remove ${d}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {anyDeptLoading && (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-slate-400" aria-busy="true">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading comparison data...
            </div>
          )}

          {/* Per-department stat cards */}
          {deptQueries.filter((q) => q.data).length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {deptQueries.map((q, idx) => {
                  if (!q.data) return null;
                  const d = q.data;
                  const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
                  const totalVendors = d.vendors.length;
                  const totalValue = d.vendors.reduce((s, v) => s + v.total_value, 0);
                  return (
                    <div key={selectedDepts[idx]} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4" style={{ borderLeftColor: color }}>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{d.department}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{totalVendors} vendors</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(totalValue)}</span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Avg: {formatCurrency(d.department_average)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grouped bar chart: vendors on Y-axis, one bar per department */}
              {(() => {
                // Collect all unique vendors across selected departments
                const vendorSet = new Set<string>();
                const deptVendorMap: Record<string, Record<string, number>> = {};
                deptQueries.forEach((q, idx) => {
                  if (!q.data) return;
                  const dept = selectedDepts[idx];
                  deptVendorMap[dept] = {};
                  for (const v of q.data.vendors) {
                    vendorSet.add(v.supplier);
                    deptVendorMap[dept][v.supplier] = v.avg_value;
                  }
                });

                const allVendors = Array.from(vendorSet).sort();
                const barData = allVendors.map((vendor) => {
                  const row: Record<string, unknown> = {
                    supplier: vendor.length > 25 ? vendor.substring(0, 25) + "..." : vendor,
                    fullName: vendor,
                  };
                  for (const dept of selectedDepts) {
                    row[dept] = deptVendorMap[dept]?.[vendor] ?? 0;
                  }
                  return row;
                });

                // Only show top 15 vendors by max value across depts
                const top = barData
                  .map((row) => ({
                    ...row,
                    _max: Math.max(...selectedDepts.map((d) => Number(row[d]) || 0)),
                  }))
                  .sort((a, b) => b._max - a._max)
                  .slice(0, 15);

                if (top.length === 0) return null;

                return (
                  <div className="h-[500px]" aria-label="Multi-department vendor cost comparison">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                        <XAxis
                          type="number"
                          tickFormatter={(v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis dataKey="supplier" type="category" width={160} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: unknown, name: unknown) => [formatCurrency(Number(value)), String(name)]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {selectedDepts.map((dept, i) => (
                          <Bar
                            key={dept}
                            dataKey={dept}
                            fill={VENDOR_COLORS[i % VENDOR_COLORS.length]}
                            fillOpacity={0.8}
                            radius={[0, 4, 4, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Combined table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto">
                <table className="w-full text-sm" role="table" aria-label="Department vendor comparison">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Department</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Vendor</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">Contracts</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">Avg Value</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">Total</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">vs Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptQueries.flatMap((q, dIdx) => {
                      if (!q.data) return [];
                      const d = q.data;
                      const color = VENDOR_COLORS[dIdx % VENDOR_COLORS.length];
                      return d.vendors.map((v, vIdx) => {
                        const diff = d.department_average > 0
                          ? Math.round(((v.avg_value - d.department_average) / d.department_average) * 100)
                          : 0;
                        return (
                          <tr key={`${d.department}-${v.supplier}`} className={vIdx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-900"}>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-slate-600 dark:text-slate-400">{d.department}</span>
                              </span>
                            </td>
                            <td className="px-4 py-2 text-slate-900 dark:text-slate-100 font-medium">{v.supplier}</td>
                            <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400">{v.count}</td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(v.avg_value)}</td>
                            <td className="px-4 py-2 text-right text-slate-500 dark:text-slate-400">{formatCurrency(v.total_value)}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`inline-flex items-center gap-1 text-sm font-medium ${diff > 0 ? "text-red-600 dark:text-red-400" : diff < 0 ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
                                {diff > 0 ? <ArrowRight className="h-3 w-3 rotate-[-45deg]" aria-hidden="true" /> : diff < 0 ? <ArrowRight className="h-3 w-3 rotate-[45deg]" aria-hidden="true" /> : null}
                                {diff > 0 ? "+" : ""}{diff}%
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedDepts.length === 0 && !anyDeptLoading && (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select departments above to compare vendor costs across departments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
