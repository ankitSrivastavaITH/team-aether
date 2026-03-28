"use client";

import { NLQueryBar } from "@/components/nl-query-bar";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

export default function AskRichmondPage() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {t("ask.title", locale)}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t("ask.subtitle", locale)}
        </p>
      </div>

      {/* NL Query Bar — full width, prominent */}
      <div className="max-w-3xl mx-auto w-full">
        <NLQueryBar />
      </div>
    </div>
  );
}
