"use client";

import { ConcentrationRisk } from "@/components/concentration-risk";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function RiskAnalysisPage() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t("risk.title", locale)}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          {t("risk.subtitle", locale)}
        </p>
      </div>

      {/* HHI Explanation */}
      <Card className="p-5 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" data-tour="hhi-explainer">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
            <p className="font-semibold">{t("risk.hhi_title", locale)}</p>
            <p>{t("risk.hhi_desc", locale)}</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li><strong>{t("risk.hhi_low", locale)}</strong></li>
              <li><strong>{t("risk.hhi_moderate", locale)}</strong></li>
              <li><strong>{t("risk.hhi_high", locale)}</strong></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Concentration Risk Component */}
      <div data-tour="concentration-cards">
        <ConcentrationRisk />
      </div>
    </div>
  );
}
