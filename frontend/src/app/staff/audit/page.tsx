"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/collapsible-section";
import {
  History,
  CheckCircle,
  GitCompare,
  AlertTriangle,
  ClipboardCheck,
  Building2,
  Lightbulb,
} from "lucide-react";

interface TimelineDecision {
  id: number;
  contract_number: string;
  supplier: string;
  department: string;
  contract_value: number;
  verdict: string;
  confidence: string;
  summary: string;
  created_at: string;
}

interface TimelineData {
  decisions: TimelineDecision[];
  total: number;
  verdict_breakdown: Record<string, number>;
  total_value_analyzed: number;
  top_departments: { department: string; count: number }[];
  insights: string[];
}

const VERDICT_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  RENEW: {
    icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  REBID: {
    icon: GitCompare,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  ESCALATE: {
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  STAFF: {
    icon: ClipboardCheck,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AuditTimelinePage() {
  const { data, isLoading } = useQuery<TimelineData>({
    queryKey: ["decision-timeline"],
    queryFn: () => fetchAPI<TimelineData>("/api/strategy/timeline"),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <History className="h-8 w-8 animate-pulse text-blue-500" />
        <span className="ml-3 text-slate-500">Loading decision history...</span>
      </div>
    );
  }

  if (!data) return null;

  const hasDecisions = data.decisions.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Decision Audit Timeline
          </h1>
          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs">
            Institutional Memory
          </Badge>
        </div>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Every AI decision is recorded. This timeline provides an auditable
          history of procurement recommendations — building institutional
          knowledge over time.
        </p>
      </div>

      {!hasDecisions ? (
        <Card className="p-12 text-center">
          <History
            className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4"
            aria-hidden="true"
          />
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            No decisions recorded yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Use the Decision Engine to analyze contracts. Each analysis is
            automatically saved here.
          </p>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {data.total}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total Decisions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.total_value_analyzed)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Contract Value Analyzed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {data.top_departments.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Departments Covered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {Object.entries(data.verdict_breakdown)
                    .filter(([, v]) => v > 0)
                    .map(([verdict, count]) => {
                      const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.STAFF;
                      return (
                        <div key={verdict} className="text-center">
                          <p className={`text-lg font-bold ${cfg.text}`}>
                            {count}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase">
                            {verdict}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {data.insights && data.insights.length > 0 && (
            <CollapsibleSection
              title="Pattern Analysis"
              icon={Lightbulb}
              badge={`${data.insights.length} insights`}
              badgeClass="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
              defaultOpen
              summary={data.insights[0]}
            >
              <ul className="space-y-2">
                {data.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-purple-500 shrink-0 mt-0.5">→</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Top departments */}
          {data.top_departments.length > 0 && (
            <CollapsibleSection
              title="Most Analyzed Departments"
              icon={Building2}
              badge={`${data.top_departments.length} depts`}
              summary={data.top_departments.map(d => d.department).slice(0, 3).join(", ")}
            >
              <div className="flex flex-wrap gap-2">
                {data.top_departments.map((d) => (
                  <Badge key={d.department} variant="outline" className="text-xs">
                    {d.department} <span className="ml-1 font-bold">{d.count}</span>
                  </Badge>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
              aria-hidden="true"
            />

            <div className="space-y-4" role="list" aria-label="Decision timeline">
              {data.decisions.map((d) => {
                const cfg = VERDICT_CONFIG[d.verdict] || VERDICT_CONFIG.STAFF;
                const Icon = cfg.icon;

                return (
                  <div
                    key={d.id}
                    role="listitem"
                    className="relative pl-12"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-3 top-4 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}
                    >
                      <Icon
                        className={`h-3 w-3 ${cfg.text}`}
                        aria-hidden="true"
                      />
                    </div>

                    <Card
                      className={`border ${cfg.border} hover:shadow-md transition-shadow`}
                    >
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={`text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                              >
                                {d.verdict}
                              </Badge>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {d.supplier}
                              </span>
                              <span className="text-xs text-slate-400">
                                {d.contract_number}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                              {d.summary}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span>{d.department}</span>
                              <span>
                                {d.contract_value
                                  ? formatCurrency(d.contract_value)
                                  : ""}
                              </span>
                              {d.confidence && d.confidence !== "STAFF" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {d.confidence}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatRelativeTime(d.created_at)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            All decisions are automatically recorded for audit compliance.
            Showing most recent {data.decisions.length} of {data.total} total.
          </p>
        </>
      )}
    </div>
  );
}
