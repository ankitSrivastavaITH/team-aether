"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Spending Insights (Public View) ────────────────────────────

interface InsightsData {
  insights: string[];
  disclaimer: string;
}

export function SpendingInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ["insights-summary"],
    queryFn: () => fetchAPI<InsightsData>("/api/insights/summary"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading)
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Generating insights...</span>
        </div>
      </Card>
    );

  if (!data?.insights?.length) return null;

  return (
    <Card className="p-6" role="region" aria-label="AI-generated spending insights">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Key Insights</h2>
      </div>
      <ul className="space-y-3">
        {data.insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-3 text-base leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400 mt-4">{data.disclaimer}</p>
    </Card>
  );
}

// ─── Rich Risk Alerts (Staff View) ──────────────────────────────

interface ContractData {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  days_to_expiry: number;
  description: string;
  procurement_type: string;
  solicitation_type: string;
  start_date: string;
  end_date: string;
  risk_level: string;
}

interface AIRecommendation {
  action: string;
  urgency: string;
  summary: string;
  recommendation: string;
  risks: string[];
}

interface RiskAlert {
  contract: ContractData;
  ai_recommendation: AIRecommendation;
}

interface RiskData {
  alerts: RiskAlert[];
  department_risk: Array<{
    department: string;
    total: number;
    critical: number;
    total_value: number;
  }>;
  total_critical: number;
  disclaimer: string;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  review: { bg: "bg-amber-100", text: "text-amber-800", label: "Review" },
  renew: { bg: "bg-blue-100", text: "text-blue-800", label: "Renew" },
  escalate: { bg: "bg-red-100", text: "text-red-800", label: "Escalate" },
  rebid: { bg: "bg-purple-100", text: "text-purple-800", label: "Rebid" },
};


export function RiskNarrative() {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["risk-narrative"],
    queryFn: () => fetchAPI<RiskData>("/api/insights/risk-narrative"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading)
    return (
      <Card className="p-4 border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Analyzing contract risk...</span>
        </div>
      </Card>
    );

  if (!data?.alerts?.length) return null;

  const visibleAlerts = showAll ? data.alerts : data.alerts.slice(0, 3);

  return (
    <Card className="border-red-200 bg-red-50/20 overflow-hidden" role="region" aria-label="AI-generated risk alerts">
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-red-800">
            {data.total_critical} Contracts Need Action
          </h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(data.department_risk || []).slice(0, 3).map((d, i) => (
            <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 border-red-200 text-red-600">
              {d.department.length > 15 ? d.department.slice(0, 14) + "…" : d.department}: {d.critical}
            </Badge>
          ))}
        </div>
      </div>

      {/* Compact alert rows */}
      <div className="divide-y divide-red-100">
        {visibleAlerts.map((alert, i) => {
          const { contract: c, ai_recommendation: rec } = alert;
          const actionStyle = ACTION_STYLES[rec.action] || ACTION_STYLES.review;
          const isExpanded = expandedId === i;

          return (
            <div key={i}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : i)}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-inset flex items-center gap-3"
                aria-expanded={isExpanded}
                style={{ minHeight: 44 }}
              >
                <Badge className={`${actionStyle.bg} ${actionStyle.text} border-0 text-xs px-2 py-0.5 flex-shrink-0`}>
                  {actionStyle.label}
                </Badge>
                <span className="font-medium text-sm text-slate-800 truncate flex-1">{c.supplier}</span>
                <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{formatCurrency(c.value)}</span>
                <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1 w-20 justify-end">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {c.days_to_expiry === 0 ? "Today" : `${c.days_to_expiry}d`}
                </span>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                  : <ChevronDown className="h-4 w-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                }
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-3 bg-white border-t border-red-100">
                  <div className="bg-blue-50 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      <span className="font-semibold text-xs text-blue-800">AI Recommendation</span>
                    </div>
                    <p className="text-sm text-blue-900">{rec.recommendation}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-400">Department</span><br/><span className="text-slate-700">{c.department}</span></div>
                    <div><span className="text-slate-400">Expires</span><br/><span className="text-slate-700 font-medium">{formatDate(c.end_date)}</span></div>
                    <div><span className="text-slate-400">Type</span><br/><span className="text-slate-700">{c.procurement_type}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {data.alerts.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full px-4 py-2 text-center text-xs text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors border-t border-red-100 font-medium"
          style={{ minHeight: 36 }}
        >
          {showAll ? "Show less" : `Show all ${data.alerts.length} alerts`}
        </button>
      )}
    </Card>
  );
}
