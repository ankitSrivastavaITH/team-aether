"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, Loader2 } from "lucide-react";

interface InsightsData {
  insights: string[];
  disclaimer: string;
}

interface RiskData {
  narratives: string[];
  disclaimer: string;
}

export function SpendingInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ["insights-summary"],
    queryFn: () => fetchAPI<InsightsData>("/api/insights/summary"),
    staleTime: 5 * 60 * 1000, // Cache for 5 min
  });

  if (isLoading) return (
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

export function RiskNarrative() {
  const { data, isLoading } = useQuery({
    queryKey: ["risk-narrative"],
    queryFn: () => fetchAPI<RiskData>("/api/insights/risk-narrative"),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <Card className="p-6 border-red-200 bg-red-50/30">
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>Analyzing risk...</span>
      </div>
    </Card>
  );

  if (!data?.narratives?.length) return null;

  return (
    <Card className="p-6 border-red-200 bg-red-50/30" role="region" aria-label="AI-generated risk narrative">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-red-800">Risk Alerts — Action Required</h2>
      </div>
      <ul className="space-y-3">
        {data.narratives.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-red-900">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-red-400 mt-4">{data.disclaimer}</p>
    </Card>
  );
}
