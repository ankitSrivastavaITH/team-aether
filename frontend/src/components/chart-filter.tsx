"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DeptStat {
  department: string;
  count: number;
  total_value: number;
}

interface ChartFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function DepartmentChartFilter({ selected, onChange }: ChartFilterProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["contract-stats"],
    queryFn: () => fetchAPI<{ departments: DeptStat[] }>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  const departments = stats?.departments ?? [];
  const sorted = [...departments].sort((a, b) => b.total_value - a.total_value);
  const maxValue = sorted[0]?.total_value || 1;
  const visible = expanded ? sorted : sorted.slice(0, 8);

  function toggle(dept: string) {
    if (selected.includes(dept)) {
      onChange(selected.filter(d => d !== dept));
    } else {
      onChange([...selected, dept]);
    }
  }

  if (departments.length === 0) return null;

  return (
    <Card className="p-3 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Filter by Department
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear ({selected.length})
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {visible.map((dept) => {
          const barWidth = (dept.total_value / maxValue) * 100;

          return (
            <button
              key={dept.department}
              onClick={() => toggle(dept.department)}
              className={`w-full text-left rounded-md transition-all group relative overflow-hidden ${
                selected.length > 0 && !selected.includes(dept.department)
                  ? "opacity-40 hover:opacity-70"
                  : "hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
              }`}
              style={{ minHeight: 32 }}
              aria-pressed={selected.includes(dept.department)}
              aria-label={`${dept.department}: ${dept.count} contracts, ${formatCurrency(dept.total_value)}`}
            >
              {/* Bar background — color intensity based on value */}
              <div
                className={`absolute inset-y-0 left-0 rounded-md transition-all ${
                  selected.includes(dept.department)
                    ? "bg-blue-400/50 dark:bg-blue-600/40"
                    : ""
                }`}
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: selected.includes(dept.department)
                    ? undefined
                    : `rgba(37, 99, 235, ${0.08 + (barWidth / 100) * 0.25})`,
                }}
              />

              {/* Content overlay */}
              <div className="relative flex items-center gap-2 px-2 py-1.5">
                {/* Checkbox */}
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.includes(dept.department)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : selected.length === 0
                    ? "border-slate-300 dark:border-slate-600"
                    : "border-slate-300 dark:border-slate-600"
                }`}>
                  {selected.includes(dept.department) && <Check className="h-3 w-3" />}
                </div>

                {/* Department name */}
                <span className={`text-xs font-medium truncate flex-1 ${
                  selected.includes(dept.department)
                    ? "text-blue-800 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300"
                }`}>
                  {dept.department}
                </span>

                {/* Stats */}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">
                  {dept.count}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex-shrink-0 tabular-nums w-16 text-right">
                  {dept.total_value >= 1e9
                    ? `$${(dept.total_value / 1e9).toFixed(1)}B`
                    : dept.total_value >= 1e6
                    ? `$${(dept.total_value / 1e6).toFixed(0)}M`
                    : `$${(dept.total_value / 1e3).toFixed(0)}K`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {sorted.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-1 flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline py-1"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all {sorted.length}</>}
        </button>
      )}
    </Card>
  );
}
