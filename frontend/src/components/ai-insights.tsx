"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, AlertTriangle, Loader2, ChevronDown, ChevronUp,
  Clock, Building2, FileText,
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

const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

function RiskAlertCard({ alert }: { alert: RiskAlert }) {
  const [expanded, setExpanded] = useState(false);
  const { contract: c, ai_recommendation: rec } = alert;
  const actionStyle = ACTION_STYLES[rec.action] || ACTION_STYLES.review;
  const urgencyStyle = URGENCY_STYLES[rec.urgency] || URGENCY_STYLES.high;

  return (
    <Card
      className={`border-l-4 transition-all ${
        rec.urgency === "critical"
          ? "border-l-red-500"
          : rec.urgency === "high"
          ? "border-l-orange-500"
          : "border-l-yellow-500"
      }`}
    >
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
        aria-expanded={expanded}
        aria-label={`${rec.action} ${c.supplier} ${formatCurrency(c.value)} contract. Click to expand details.`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${actionStyle.bg} ${actionStyle.text} border-0 font-semibold`}>
                {actionStyle.label}
              </Badge>
              <Badge className={`${urgencyStyle.bg} ${urgencyStyle.text} border-0`}>
                {rec.urgency}
              </Badge>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {c.days_to_expiry === 0 ? "Expires today" : `${c.days_to_expiry} days left`}
              </span>
            </div>
            <p className="font-semibold text-base">{c.supplier}</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {c.department} · {formatCurrency(c.value)}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {/* AI Recommendation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span className="font-semibold text-sm text-blue-800">AI Recommendation</span>
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">{rec.recommendation}</p>
            {rec.risks && rec.risks.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-blue-700">Risks if no action:</span>
                <ul className="mt-1 space-y-1">
                  {rec.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" aria-hidden="true" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Contract Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Contract Details
            </h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Contract #</dt>
                <dd className="font-mono text-xs mt-0.5">{c.contract_number}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Value</dt>
                <dd className="font-semibold mt-0.5">{formatCurrency(c.value)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="mt-0.5">{c.department}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Vendor</dt>
                <dd className="mt-0.5">{c.supplier}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Start Date</dt>
                <dd className="mt-0.5">{formatDate(c.start_date)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Expiry Date</dt>
                <dd className="mt-0.5 font-semibold text-red-700">{formatDate(c.end_date)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Procurement Type</dt>
                <dd className="mt-0.5">{c.procurement_type}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Solicitation</dt>
                <dd className="mt-0.5">{c.solicitation_type}</dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          {c.description && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{c.description}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function RiskNarrative() {
  const { data, isLoading } = useQuery({
    queryKey: ["risk-narrative"],
    queryFn: () => fetchAPI<RiskData>("/api/insights/risk-narrative"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading)
    return (
      <Card className="p-6 border-red-200 bg-red-50/30">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Analyzing contract risk...</span>
        </div>
      </Card>
    );

  if (!data?.alerts?.length) return null;

  return (
    <div role="region" aria-label="AI-generated risk alerts" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-red-800">
            Risk Alerts — {data.total_critical} Contracts Need Action
          </h2>
        </div>
      </div>

      {/* Department risk summary */}
      {data.department_risk && data.department_risk.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {data.department_risk.map((d, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-sm px-3 py-1 gap-1.5 border-red-200 text-red-700"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              {d.department}: {d.critical} critical
            </Badge>
          ))}
        </div>
      )}

      {/* Individual alerts */}
      <div className="space-y-3">
        {data.alerts.map((alert, i) => (
          <RiskAlertCard key={i} alert={alert} />
        ))}
      </div>

      <p className="text-xs text-red-400">{data.disclaimer}</p>
    </div>
  );
}
