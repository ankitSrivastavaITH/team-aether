"use client";

import { ConcentrationRisk } from "@/components/concentration-risk";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function RiskAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Vendor Concentration Risk
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Analyze vendor concentration across departments to identify
          dependency risks and competition gaps.
        </p>
      </div>

      {/* HHI Explanation */}
      <Card className="p-5 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
            <p className="font-semibold">What is the HHI (Herfindahl-Hirschman Index)?</p>
            <p>
              The HHI measures market concentration by summing the squares of each vendor{"'"}s
              market share percentage. A lower score means more competition among vendors;
              a higher score means spending is concentrated among fewer vendors.
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li><strong>Below 1,500</strong> — Low concentration (healthy competition)</li>
              <li><strong>1,500 to 2,500</strong> — Moderate concentration</li>
              <li><strong>Above 2,500</strong> — High concentration (dependency risk)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Concentration Risk Component */}
      <ConcentrationRisk />
    </div>
  );
}
