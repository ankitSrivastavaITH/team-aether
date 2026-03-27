"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currencyTick(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function formatTooltipCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 shadow-md text-[#1E293B] text-sm"
    >
      {label !== undefined && (
        <p className="font-semibold mb-1">{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color ?? "#1E293B" }}>
          {entry.name}:{" "}
          {typeof entry.value === "number" && entry.name !== "Contracts"
            ? formatTooltipCurrency(entry.value)
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Yearly Spending Chart
// ---------------------------------------------------------------------------

interface YearlyRow {
  year: number;
  contract_count: number;
  total_value: number;
  avg_value: number;
}

interface YearlyResponse {
  data: YearlyRow[];
}

export function YearlySpendingChart() {
  const reducedMotion = useReducedMotion();
  const { data, isLoading, isError } = useQuery<YearlyResponse>({
    queryKey: ["analytics-spending-by-year"],
    queryFn: () => fetchAPI<YearlyResponse>("/api/analytics/spending-by-year"),
    staleTime: 10 * 60 * 1000,
  });

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Year-over-Year Spending
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="h-[320px] bg-[#E2E8F0] animate-pulse rounded-lg"
            aria-busy="true"
            aria-label="Loading yearly spending chart"
          />
        )}
        {isError && (
          <div
            role="alert"
            className="h-[320px] flex items-center justify-center text-red-600 text-sm"
          >
            Unable to load yearly spending data.
          </div>
        )}
        {!isLoading && !isError && (
          <div
            role="img"
            aria-label="Area chart showing total contract spending by year. Each bar also shows the number of contracts awarded that year."
          >
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={rows}
                margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 13, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={currencyTick}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#7c3aed" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CurrencyTooltip />} wrapperStyle={{ outline: "none" }} />
                <Legend
                  formatter={(value: string) => (
                    <span style={{ fontSize: 13, color: "#1E293B" }}>{value}</span>
                  )}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_value"
                  name="Total Value"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  isAnimationActive={!reducedMotion}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="contract_count"
                  name="Contracts"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#7c3aed" }}
                  isAnimationActive={!reducedMotion}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Expiry Timeline Chart
// ---------------------------------------------------------------------------

interface ExpiryRow {
  month: string;
  count: number;
  total_value: number;
}

interface ExpiryResponse {
  data: ExpiryRow[];
}

function expiryBarColor(month: string): string {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const prefix = month.slice(0, 7); // "YYYY-MM"
  if (prefix === thisMonth) return "#dc2626";
  if (prefix === nextMonthStr) return "#d97706";
  return "#2563EB";
}

function formatMonthLabel(month: string): string {
  // month is like "2025-03-01 00:00:00" or "2025-03-01"
  const prefix = month.slice(0, 7);
  const [year, m] = prefix.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

export function ExpiryTimelineChart() {
  const reducedMotion = useReducedMotion();
  const { data, isLoading, isError } = useQuery<ExpiryResponse>({
    queryKey: ["analytics-expiry-timeline"],
    queryFn: () => fetchAPI<ExpiryResponse>("/api/analytics/expiry-timeline"),
    staleTime: 5 * 60 * 1000,
  });

  const rows = (data?.data ?? []).map((r) => ({
    ...r,
    label: formatMonthLabel(r.month),
    fill: expiryBarColor(r.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Contracts Expiring (Next 12 Months)
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="h-[320px] bg-[#E2E8F0] animate-pulse rounded-lg"
            aria-busy="true"
            aria-label="Loading expiry timeline chart"
          />
        )}
        {isError && (
          <div
            role="alert"
            className="h-[320px] flex items-center justify-center text-red-600 text-sm"
          >
            Unable to load expiry timeline data.
          </div>
        )}
        {!isLoading && !isError && (
          <div
            role="img"
            aria-label="Bar chart showing contracts expiring each month for the next 12 months. Red bars indicate the current month, yellow the next month."
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={rows}
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                aria-hidden="true"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CurrencyTooltip />} wrapperStyle={{ outline: "none" }} />
                <Bar
                  dataKey="count"
                  name="Contracts"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reducedMotion}
                >
                  {rows.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-[#475569] justify-center">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#dc2626]" aria-hidden="true" />
                This month
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#d97706]" aria-hidden="true" />
                Next month
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-[#2563EB]" aria-hidden="true" />
                Upcoming
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Procurement Type Chart
// ---------------------------------------------------------------------------

interface ProcurementRow {
  procurement_type: string;
  count: number;
  total_value: number;
}

interface ProcurementResponse {
  data: ProcurementRow[];
}

export function ProcurementTypeChart() {
  const reducedMotion = useReducedMotion();
  const { data, isLoading, isError } = useQuery<ProcurementResponse>({
    queryKey: ["analytics-spending-by-type"],
    queryFn: () => fetchAPI<ProcurementResponse>("/api/analytics/spending-by-type"),
    staleTime: 10 * 60 * 1000,
  });

  const rows = [...(data?.data ?? [])]
    .sort((a, b) => a.total_value - b.total_value)
    .slice(-10);

  const topType = data?.data?.[0]?.procurement_type ?? "the top category";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Spending by Procurement Type
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="h-[320px] bg-[#E2E8F0] animate-pulse rounded-lg"
            aria-busy="true"
            aria-label="Loading procurement type chart"
          />
        )}
        {isError && (
          <div
            role="alert"
            className="h-[320px] flex items-center justify-center text-red-600 text-sm"
          >
            Unable to load procurement type data.
          </div>
        )}
        {!isLoading && !isError && (
          <div
            role="img"
            aria-label={`Horizontal bar chart showing spending by procurement type. ${topType} has the highest spending.`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 8, right: 60, bottom: 8, left: 160 }}
                aria-hidden="true"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={currencyTick}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="procurement_type"
                  width={152}
                  tick={{ fontSize: 12, fill: "#1E293B" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip content={<CurrencyTooltip />} wrapperStyle={{ outline: "none" }} cursor={{ fill: "#EFF6FF" }} />
                <Bar
                  dataKey="total_value"
                  name="Total Value"
                  fill="#2563EB"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!reducedMotion}
                >
                  {rows.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(37, 99, 235, ${0.4 + (index / (rows.length - 1 || 1)) * 0.6})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Contract Size Distribution Chart
// ---------------------------------------------------------------------------

interface SizeRow {
  bucket: string;
  sort_order: number;
  count: number;
  total_value: number;
}

interface SizeResponse {
  data: SizeRow[];
}

export function ContractSizeChart() {
  const reducedMotion = useReducedMotion();
  const { data, isLoading, isError } = useQuery<SizeResponse>({
    queryKey: ["analytics-contract-size-distribution"],
    queryFn: () => fetchAPI<SizeResponse>("/api/analytics/contract-size-distribution"),
    staleTime: 10 * 60 * 1000,
  });

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Contract Size Distribution
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="h-[320px] bg-[#E2E8F0] animate-pulse rounded-lg"
            aria-busy="true"
            aria-label="Loading contract size distribution chart"
          />
        )}
        {isError && (
          <div
            role="alert"
            className="h-[320px] flex items-center justify-center text-red-600 text-sm"
          >
            Unable to load contract size data.
          </div>
        )}
        {!isLoading && !isError && (
          <div
            role="img"
            aria-label="Bar chart showing the number of contracts by value bucket, ranging from under $50K to over $10M."
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={rows}
                margin={{ top: 8, right: 16, bottom: 40, left: 8 }}
                aria-hidden="true"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CurrencyTooltip />} wrapperStyle={{ outline: "none" }} />
                <Bar
                  dataKey="count"
                  name="Contracts"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reducedMotion}
                >
                  {rows.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(124, 58, 237, ${0.35 + (index / (rows.length - 1 || 1)) * 0.65})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
