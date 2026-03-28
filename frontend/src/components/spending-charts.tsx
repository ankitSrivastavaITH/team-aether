"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function currencyTick(value: unknown) {
  const v = typeof value === "number" ? value : Number(value);
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function formatTooltipValue(value: number): string {
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const VENDOR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#4f46e5",
  "#be185d",
];

interface DepartmentEntry {
  department: string;
  count: number;
  total_value: number;
}

interface VendorEntry {
  supplier: string;
  count: number;
  total_value: number;
}

interface DepartmentSpendingChartProps {
  data: DepartmentEntry[];
}

interface VendorPieChartProps {
  data: VendorEntry[];
}

// Custom tooltip for bar chart
function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-md text-[#1E293B] text-base"
    >
      <span className="font-semibold">{formatTooltipValue(payload[0].value)}</span>
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
      className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-2 shadow-md text-[#1E293B] text-base"
    >
      <p className="font-semibold">{payload[0].name}</p>
      <p>{formatTooltipValue(payload[0].value)}</p>
    </div>
  );
}


export function DepartmentSpendingChart({ data }: DepartmentSpendingChartProps) {
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  // Top 10 departments, sorted ascending for horizontal bar (recharts renders bottom-to-top)
  const sorted = [...data]
    .sort((a, b) => a.total_value - b.total_value)
    .slice(-10);

  // Dynamic aria-label: describe the data, not just the chart type
  const descSorted = [...data].sort((a, b) => b.total_value - a.total_value);
  const topDept = descSorted[0];
  const ariaLabel = topDept
    ? `Bar chart: ${topDept.department} leads spending at ${currencyTick(topDept.total_value)}, followed by ${descSorted[1]?.department || "others"}. Click a bar to drill into that department.`
    : "Bar chart showing spending by department.";

  function handleBarClick(barData: { department?: string } | null) {
    if (barData?.department) {
      router.push(`/public/department/${encodeURIComponent(barData.department)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Spending by Department
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[#475569] mb-2">Click a bar to explore department details.</p>
        <div
          role="img"
          aria-label={ariaLabel}
          style={{ height: 400 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 8, right: 40, bottom: 8, left: 180 }}
              aria-hidden="true"
              style={{ cursor: "pointer" }}
              onClick={(chartData: unknown) => {
                const d = chartData as { activePayload?: Array<{ payload?: { department?: string } }> } | null;
                if (d?.activePayload && d.activePayload.length > 0) {
                  handleBarClick(d.activePayload[0].payload ?? null);
                }
              }}
            >
              <XAxis
                type="number"
                tickFormatter={currencyTick}
                tick={{ fontSize: 13, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="department"
                width={172}
                tick={{ fontSize: 13, fill: "#1E293B" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "#EFF6FF" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Bar
                dataKey="total_value"
                name="Total Value"
                radius={[0, 4, 4, 0]}
                isAnimationActive={!reducedMotion}
              >
                {sorted.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(37, 99, 235, ${0.45 + (index / (sorted.length - 1 || 1)) * 0.55})`}
                    aria-label={`${entry.department}: ${currencyTick(entry.total_value)}. Click to view details.`}
                  />
                ))}
                <LabelList
                  dataKey="total_value"
                  position="right"
                  formatter={(value: unknown) => currencyTick(value as number)}
                  style={{ fontSize: 12, fill: "#475569" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function VendorPieChart({ data }: VendorPieChartProps) {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  // Top 8 vendors
  const top8 = [...data]
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 8);

  // Dynamic aria-label: describe the data, not just the chart type
  const topVendor = top8[0];
  const ariaLabel = topVendor
    ? `Donut chart: ${topVendor.supplier} holds the largest share at ${currencyTick(topVendor.total_value)}.`
    : "Donut chart showing top vendors.";

  // Custom label: render vendor name + short value on segment
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    name,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    name?: string;
    percent?: number;
  }) => {
    if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !name || !percent) return null;
    // Only label if segment is large enough
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    // Truncate long names
    const label = name.length > 12 ? name.slice(0, 11) + "…" : name;
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Top Vendors by Contract Value
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[#475569] mb-2">Click a slice to see vendor contracts.</p>
        <div
          role="img"
          aria-label={ariaLabel}
          style={{ height: 380 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart aria-hidden="true" style={{ cursor: "pointer" }}>
              <Pie
                data={top8}
                dataKey="total_value"
                nameKey="supplier"
                cx="50%"
                cy="45%"
                innerRadius="38%"
                outerRadius="65%"
                paddingAngle={2}
                labelLine={false}
                label={renderLabel}
                isAnimationActive={!reducedMotion}
                style={{ cursor: "pointer" }}
                onClick={(_, index) => {
                  const vendor = top8[index]?.supplier;
                  if (vendor) router.push(`/public/vendor/${encodeURIComponent(vendor)}`);
                }}
              >
                {top8.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={VENDOR_COLORS[index % VENDOR_COLORS.length]}
                    aria-label={`${entry.supplier}: ${formatTooltipValue(entry.total_value)}. Click to view vendor contracts.`}
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
                    {value}
                  </span>
                )}
                wrapperStyle={{ paddingTop: 16 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
