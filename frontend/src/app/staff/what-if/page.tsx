"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingDown,
  AlertTriangle,
  Building2,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CollapsibleSection } from "@/components/collapsible-section";

interface Scenario {
  rate: string;
  savings: number;
  label: string;
}

interface WhatIfData {
  concentrated_contracts: {
    supplier: string;
    department: string;
    vendor_total: number;
    share_pct: number;
  }[];
  expiring_high_value: {
    supplier: string;
    contract_number: string;
    department: string;
    value: number;
    days_to_expiry: number;
  }[];
  scenarios: {
    conservative: Scenario;
    moderate: Scenario;
    aggressive: Scenario;
  };
  total_at_risk: number;
  department_opportunities: {
    department: string;
    total: number;
    total_value: number;
    expiring: number;
    expiring_value: number;
    unique_vendors: number;
    expiring_pct: number;
  }[];
  recommendations: {
    priority: string;
    action: string;
    detail: string;
    next_step: string;
    link?: string;
    link_label?: string;
  }[];
}

const SCENARIO_STYLES = {
  conservative: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500",
  },
  moderate: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
  },
  aggressive: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500",
  },
};

export default function WhatIfPage() {
  const [selectedScenario, setSelectedScenario] = useState<
    "conservative" | "moderate" | "aggressive"
  >("moderate");

  const { data, isLoading } = useQuery<WhatIfData>({
    queryKey: ["what-if"],
    queryFn: () => fetchAPI<WhatIfData>("/api/strategy/what-if"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Calculator className="h-8 w-8 animate-pulse text-blue-500" />
        <span className="ml-3 text-slate-500">Calculating scenarios...</span>
      </div>
    );
  }

  if (!data) return null;

  const scenario = data.scenarios[selectedScenario];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            What-If Savings Estimator
          </h1>
          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs">
            Strategic Intelligence
          </Badge>
        </div>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Model the fiscal impact of rebidding concentrated and expiring
          contracts under different competitive scenarios.
        </p>
      </div>

      {/* Scenario Selector */}
      <Card data-tour="scenarios">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb
              className="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Select Rebid Scenario
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              Object.entries(data.scenarios) as [
                "conservative" | "moderate" | "aggressive",
                Scenario,
              ][]
            ).map(([key, s]) => {
              const styles = SCENARIO_STYLES[key];
              const isSelected = key === selectedScenario;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  className={`text-left p-4 rounded-lg border-2 transition-all min-h-[44px] focus:outline-none focus:ring-2 ${
                    styles.ring
                  } ${
                    isSelected
                      ? `${styles.bg} ${styles.border} shadow-md`
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isSelected
                          ? styles.text
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {key}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isSelected ? styles.text : ""
                      }`}
                    >
                      {s.rate} savings
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(s.savings)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {s.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Summary bar */}
          <div className="mt-4 p-4 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm opacity-80">
                  Total contract value at risk
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.total_at_risk)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">
                  Projected savings ({scenario.rate})
                </p>
                <p className="text-3xl font-extrabold text-emerald-400 dark:text-emerald-600">
                  {formatCurrency(scenario.savings)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div data-tour="recommendations">
        <CollapsibleSection
          title="AI Recommendations — What To Do Next"
          icon={Lightbulb}
          badge={`${data.recommendations.filter(r => r.priority === "critical").length} critical`}
          badgeClass="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          defaultOpen
          summary={data.recommendations[0]?.action}
        >
          <div className="space-y-3" role="list">
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                role="listitem"
                className={`p-4 rounded-lg border ${
                  rec.priority === "critical"
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                    : rec.priority === "high"
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                    : rec.priority === "medium"
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Badge className={`text-[10px] shrink-0 mt-0.5 ${
                    rec.priority === "critical"
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      : rec.priority === "high"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                      : rec.priority === "medium"
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {rec.priority.toUpperCase()}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {rec.action}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {rec.detail}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      {rec.next_step}
                    </p>
                    {rec.link && (
                      <Link
                        href={rec.link}
                        className="inline-flex items-center gap-1.5 mt-3 px-4 min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        {rec.link_label || "Take Action →"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
        </div>
      )}

      {/* Concentrated + Expiring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollapsibleSection
          title="High-Concentration Vendors"
          icon={AlertTriangle}
          badge={`${data.concentrated_contracts.length} found`}
          summary={data.concentrated_contracts[0]?.supplier}
        >
          <div className="space-y-2" role="list">
            {data.concentrated_contracts.map((c, i) => (
              <div key={i} role="listitem" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.department}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{formatCurrency(c.vendor_total)}</p>
                  <Badge className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">{c.share_pct}% share</Badge>
                </div>
              </div>
            ))}
            {data.concentrated_contracts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No highly concentrated vendors found.</p>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="High-Value Expiring Contracts"
          icon={TrendingDown}
          badge={`${data.expiring_high_value.length} found`}
          summary={data.expiring_high_value[0]?.supplier}
        >
          <div className="space-y-2" role="list">
            {data.expiring_high_value.map((c, i) => (
              <div key={i} role="listitem" className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.department} &middot; {c.contract_number}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{formatCurrency(c.value)}</p>
                  <Badge className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">{c.days_to_expiry}d left</Badge>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Department Opportunities */}
      <CollapsibleSection
        title="Department Rebid Opportunities"
        icon={Building2}
        badge={`${data.department_opportunities.length} depts`}
        summary={`Top: ${data.department_opportunities[0]?.department}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Department</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Expiring</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Expiring Value</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Est. Savings</th>
              </tr>
            </thead>
            <tbody>
              {data.department_opportunities.map((d) => {
                const rate = parseFloat(scenario.rate) / 100;
                const estSavings = Math.round(d.expiring_value * rate);
                return (
                  <tr key={d.department} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{d.department}</td>
                    <td className="py-2.5 px-3 text-right"><Badge variant="outline" className="text-xs">{d.expiring} contracts</Badge></td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(d.expiring_value)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(estSavings)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Savings estimates are projections based on industry rebid averages
        (5-15%). Actual savings depend on market conditions, vendor
        availability, and procurement method. For planning purposes only.
      </p>
    </div>
  );
}
