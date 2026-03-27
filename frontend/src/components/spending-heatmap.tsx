"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonthRow {
  month: string; // "2024-01-01 00:00:00" or "2024-01-01"
  starts?: number;
  expirations?: number;
}

interface MonthlyActivityResponse {
  starts: MonthRow[];
  expirations: MonthRow[];
}

interface CellData {
  year: number;
  month: number; // 0-indexed
  starts: number;
  expirations: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseMonthKey(monthStr: string): { year: number; month: number } | null {
  const prefix = monthStr.slice(0, 7); // "YYYY-MM"
  const parts = prefix.split("-");
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  if (isNaN(year) || isNaN(month)) return null;
  return { year, month };
}

function intensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-slate-100 dark:bg-slate-800";
  const ratio = value / max;
  if (ratio < 0.1) return "bg-blue-100 dark:bg-blue-950";
  if (ratio < 0.25) return "bg-blue-200 dark:bg-blue-900";
  if (ratio < 0.5) return "bg-blue-400 dark:bg-blue-700";
  if (ratio < 0.75) return "bg-blue-600 dark:bg-blue-500";
  return "bg-blue-800 dark:bg-blue-400";
}

function textContrastClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "text-slate-400 dark:text-slate-600";
  const ratio = value / max;
  if (ratio < 0.5) return "text-blue-700 dark:text-blue-200";
  return "text-white dark:text-blue-950";
}

// ---------------------------------------------------------------------------
// HeatmapGrid
// ---------------------------------------------------------------------------

function HeatmapGrid({
  title,
  cells,
  dataKey,
  maxValue,
}: {
  title: string;
  cells: Map<string, CellData>;
  dataKey: "starts" | "expirations";
  maxValue: number;
}) {
  const years = useMemo(() => {
    const ys = new Set<number>();
    cells.forEach((c) => ys.add(c.year));
    return Array.from(ys).sort((a, b) => a - b);
  }, [cells]);

  if (years.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400 py-4">
        No data available.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table
          className="border-collapse text-xs"
          role="table"
          aria-label={title}
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="w-12 text-right pr-2 text-slate-500 dark:text-slate-400 font-normal pb-1"
                aria-label="Year"
              >
                Year
              </th>
              {MONTH_LABELS.map((m) => (
                <th
                  key={m}
                  scope="col"
                  className="w-10 text-center text-slate-500 dark:text-slate-400 font-normal pb-1"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th
                  scope="row"
                  className="text-right pr-2 text-slate-600 dark:text-slate-400 font-medium"
                >
                  {year}
                </th>
                {Array.from({ length: 12 }, (_, monthIdx) => {
                  const key = `${year}-${monthIdx}`;
                  const cell = cells.get(key);
                  const value = cell ? cell[dataKey] : 0;
                  const bg = intensityClass(value, maxValue);
                  const textCls = textContrastClass(value, maxValue);

                  return (
                    <td key={monthIdx} className="p-0.5">
                      <div
                        className={`w-10 h-8 rounded flex items-center justify-center ${bg} transition-colors`}
                        title={`${year} ${MONTH_LABELS[monthIdx]}: ${value} ${dataKey}`}
                        role="cell"
                        aria-label={`${MONTH_LABELS[monthIdx]} ${year}: ${value}`}
                      >
                        <span className={`text-[10px] font-medium ${textCls}`}>
                          {value > 0 ? value : ""}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3" aria-label="Color intensity legend">
        <span className="text-xs text-slate-500 dark:text-slate-400">Fewer</span>
        {["bg-blue-100 dark:bg-blue-950", "bg-blue-200 dark:bg-blue-900", "bg-blue-400 dark:bg-blue-700", "bg-blue-600 dark:bg-blue-500", "bg-blue-800 dark:bg-blue-400"].map(
          (cls, i) => (
            <div
              key={i}
              className={`w-5 h-4 rounded ${cls}`}
              aria-hidden="true"
            />
          )
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400">More</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpendingHeatmap (exported component)
// ---------------------------------------------------------------------------

export function SpendingHeatmap() {
  const { data, isLoading, isError } = useQuery<MonthlyActivityResponse>({
    queryKey: ["monthly-activity"],
    queryFn: () => fetchAPI<MonthlyActivityResponse>("/api/analytics/monthly-activity"),
    staleTime: 10 * 60 * 1000,
  });

  // Build a combined cell map
  const { cells, maxStarts, maxExpirations } = useMemo(() => {
    const map = new Map<string, CellData>();

    (data?.starts ?? []).forEach((row) => {
      const parsed = parseMonthKey(row.month);
      if (!parsed) return;
      const key = `${parsed.year}-${parsed.month}`;
      const existing = map.get(key) ?? { year: parsed.year, month: parsed.month, starts: 0, expirations: 0 };
      existing.starts = row.starts ?? 0;
      map.set(key, existing);
    });

    (data?.expirations ?? []).forEach((row) => {
      const parsed = parseMonthKey(row.month);
      if (!parsed) return;
      const key = `${parsed.year}-${parsed.month}`;
      const existing = map.get(key) ?? { year: parsed.year, month: parsed.month, starts: 0, expirations: 0 };
      existing.expirations = row.expirations ?? 0;
      map.set(key, existing);
    });

    let maxS = 0;
    let maxE = 0;
    map.forEach((c) => {
      if (c.starts > maxS) maxS = c.starts;
      if (c.expirations > maxE) maxE = c.expirations;
    });

    return { cells: map, maxStarts: maxS, maxExpirations: maxE };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Contract Activity Heatmap
          </h2>
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monthly contract starts and expirations over time. Darker cells indicate higher activity.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div
            className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"
            aria-busy="true"
            aria-label="Loading heatmap data"
          />
        )}
        {isError && (
          <div
            role="alert"
            className="p-4 text-red-600 dark:text-red-400 text-sm"
          >
            Unable to load activity heatmap data.
          </div>
        )}
        {!isLoading && !isError && (
          <div className="space-y-8">
            <HeatmapGrid
              title="Contract Starts by Month"
              cells={cells}
              dataKey="starts"
              maxValue={maxStarts}
            />
            <HeatmapGrid
              title="Contract Expirations by Month"
              cells={cells}
              dataKey="expirations"
              maxValue={maxExpirations}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
