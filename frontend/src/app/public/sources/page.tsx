"use client";

import { MultiSourceExplorer } from "@/components/multi-source-explorer";
import { StateContracts } from "@/components/state-contracts";
import { Disclaimer } from "@/components/disclaimer";
import { useLocale } from "@/hooks/use-locale";

export default function SourcesPage() {
  const { locale } = useLocale();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Multi-Source Contract Explorer
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Beyond City contracts, federal and state agencies award billions to
          Richmond-area vendors. Explore contracts across City, State (eVA), and
          federal sources side-by-side.
        </p>
      </div>

      <Disclaimer locale={locale} />

      {/* Federal / Multi-Source Explorer */}
      <section aria-labelledby="multi-source-heading">
        <h2
          id="multi-source-heading"
          className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4"
        >
          Federal and Multi-Source Contracts
        </h2>
        <MultiSourceExplorer />
      </section>

      {/* Virginia State Contracts */}
      <section aria-labelledby="state-contracts-heading">
        <h2
          id="state-contracts-heading"
          className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4"
        >
          Virginia State Contracts (eVA)
        </h2>
        <StateContracts />
      </section>
    </div>
  );
}
