"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { CollapsibleSection } from "@/components/collapsible-section";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  RefreshCw,
  GitCompare,
  AlertTriangle,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface ActionItem {
  type: string;
  text: string;
  link?: string;
  link_label?: string;
}

interface DeptStrategy {
  department: string;
  total_contracts: number;
  total_value: number;
  breakdown: { renew: number; rebid: number; escalate: number };
  projected_savings: number;
  risk_level: string;
  summary: string;
  actions: ActionItem[];
  top_vendor: string;
  top_vendor_value: number;
  top_vendor_share: number;
  diversity_ratio: number;
  diversity_note: string;
  unique_vendors: number;
}

interface PortfolioData {
  strategies: DeptStrategy[];
  total_projected_savings: number;
  departments_analyzed: number;
  portfolio_insights: string[];
}

const RISK_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  high: {
    bg: "border-l-4 border-l-red-500",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  },
  medium: {
    bg: "border-l-4 border-l-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  },
  low: {
    bg: "border-l-4 border-l-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  },
};

function StrategyCard({ strategy }: { strategy: DeptStrategy }) {
  const [expanded, setExpanded] = useState(false);
  const rs = RISK_STYLES[strategy.risk_level] || RISK_STYLES.medium;
  const total =
    strategy.breakdown.renew +
    strategy.breakdown.rebid +
    strategy.breakdown.escalate;

  return (
    <Card className={`${rs.bg} overflow-hidden`}>
      <CardContent className="pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md min-h-[44px]"
          aria-expanded={expanded}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                {strategy.department}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {strategy.total_contracts} contracts &middot;{" "}
                {formatCurrency(strategy.total_value)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`text-xs ${rs.badge}`}>
                {strategy.risk_level.toUpperCase()}
              </Badge>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Summary — always visible */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {strategy.summary}
          </p>

          {/* Top vendor callout */}
          {strategy.top_vendor_share > 30 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Top vendor: {strategy.top_vendor} ({strategy.top_vendor_share}% of dept spend)
            </p>
          )}

          {/* Breakdown bar */}
          <div className="mt-3 flex items-center gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {strategy.breakdown.renew > 0 && (
              <div
                className="h-full bg-emerald-500 rounded-l-full"
                style={{
                  width: `${(strategy.breakdown.renew / total) * 100}%`,
                }}
                title={`Renew: ${strategy.breakdown.renew}`}
              />
            )}
            {strategy.breakdown.rebid > 0 && (
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${(strategy.breakdown.rebid / total) * 100}%`,
                }}
                title={`Rebid: ${strategy.breakdown.rebid}`}
              />
            )}
            {strategy.breakdown.escalate > 0 && (
              <div
                className="h-full bg-red-500 rounded-r-full"
                style={{
                  width: `${(strategy.breakdown.escalate / total) * 100}%`,
                }}
                title={`Escalate: ${strategy.breakdown.escalate}`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Renew {strategy.breakdown.renew}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Rebid {strategy.breakdown.rebid}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Escalate {strategy.breakdown.escalate}
            </span>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  Projected Savings
                </p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(strategy.projected_savings)}
                </p>
                <p className="text-[10px] text-slate-400">
                  From rebidding {strategy.breakdown.rebid} contracts
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  Vendor Diversity
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {(strategy.diversity_ratio * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-slate-400">
                  {strategy.unique_vendors} unique vendors
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                  Equity Note
                </p>
                <p className="text-sm text-purple-900 dark:text-purple-200">
                  {strategy.diversity_note}
                </p>
              </div>
            </div>

            {/* Action items */}
            {strategy.actions && strategy.actions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Recommended Actions
                </p>
                <div className="space-y-2" role="list">
                  {strategy.actions.map((a, i) => (
                    <div
                      key={i}
                      role="listitem"
                      className={`p-3 rounded-lg text-sm ${
                        a.type === "escalate"
                          ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                          : a.type === "rebid"
                          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                          : a.type === "diversify" || a.type === "equity"
                          ? "bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium shrink-0">
                          {a.type === "escalate" ? "🔴" : a.type === "rebid" ? "🟡" : a.type === "diversify" || a.type === "equity" ? "🟣" : "🟢"}
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{a.text}</p>
                      </div>
                      {a.link && (
                        <Link
                          href={a.link}
                          className={`inline-flex items-center gap-1.5 mt-2 ml-6 px-3 min-h-[36px] rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            a.type === "escalate"
                              ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                              : a.type === "rebid"
                              ? "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
                              : a.type === "diversify" || a.type === "equity"
                              ? "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500"
                          }`}
                        >
                          {a.link_label || "Take Action →"}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PortfolioStrategyPage() {
  const { data, isLoading } = useQuery<PortfolioData>({
    queryKey: ["portfolio-strategy"],
    queryFn: () => fetchAPI<PortfolioData>("/api/strategy/portfolio"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Briefcase className="h-8 w-8 animate-pulse text-blue-500" />
        <span className="ml-3 text-slate-500">
          Generating portfolio strategies...
        </span>
      </div>
    );
  }

  if (!data) return null;

  const highRisk = data.strategies.filter((s) => s.risk_level === "high");
  const medRisk = data.strategies.filter((s) => s.risk_level === "medium");
  const lowRisk = data.strategies.filter((s) => s.risk_level === "low");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Portfolio Strategy Advisor
          </h1>
          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs">
            Strategic Intelligence
          </Badge>
        </div>
        <p className="text-base text-slate-500 dark:text-slate-400">
          AI-generated procurement strategy per department — renew, rebid, or
          escalate with projected savings and equity context.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
          <CardContent className="pt-4">
            <p className="text-sm opacity-80">Total Projected Savings</p>
            <p className="text-3xl font-extrabold text-emerald-400 dark:text-emerald-600">
              {formatCurrency(data.total_projected_savings)}
            </p>
            <p className="text-xs opacity-60 mt-1">
              Across {data.departments_analyzed} departments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {highRisk.length}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                High-risk departments
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <RefreshCw className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data.strategies.reduce(
                  (sum, s) => sum + s.breakdown.rebid,
                  0
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Contracts recommended for rebid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio-wide insights */}
      {data.portfolio_insights && data.portfolio_insights.length > 0 && (
        <CollapsibleSection
          title="Portfolio Intelligence"
          icon={Briefcase}
          badge={`${data.portfolio_insights.length} insights`}
          badgeClass="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
          defaultOpen
          summary={data.portfolio_insights[0]}
        >
          <ul className="space-y-2">
            {data.portfolio_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-purple-500 shrink-0 mt-0.5">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Strategy cards by risk level */}
      {highRisk.length > 0 && (
        <CollapsibleSection
          title="Immediate Action Required"
          icon={AlertTriangle}
          badge={`${highRisk.length} depts`}
          badgeClass="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          defaultOpen
          summary={highRisk.map(s => s.department).join(", ")}
        >
          <div className="space-y-3">
            {highRisk.map((s) => (
              <StrategyCard key={s.department} strategy={s} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {medRisk.length > 0 && (
        <CollapsibleSection
          title="Review This Quarter"
          icon={GitCompare}
          badge={`${medRisk.length} depts`}
          badgeClass="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
          summary={medRisk.map(s => s.department).join(", ")}
        >
          <div className="space-y-3">
            {medRisk.map((s) => (
              <StrategyCard key={s.department} strategy={s} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {lowRisk.length > 0 && (
        <CollapsibleSection
          title="Healthy — Monitor"
          icon={RefreshCw}
          badge={`${lowRisk.length} depts`}
          badgeClass="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
          summary={lowRisk.map(s => s.department).join(", ")}
        >
          <div className="space-y-3">
            {lowRisk.map((s) => (
              <StrategyCard key={s.department} strategy={s} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Strategies generated from contract portfolio data. Projected savings
        assume 8% average from competitive rebid. Human review required for
        all procurement decisions.
      </p>
    </div>
  );
}
