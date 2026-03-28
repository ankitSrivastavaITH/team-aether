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
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Beyond City contracts, federal and state agencies award billions to
          Richmond-area vendors. Explore contracts across City, State (eVA), and
          federal sources side-by-side to get a complete picture of public spending.
        </p>
      </div>

      <Disclaimer locale={locale} />

      {/* Federal / Multi-Source Explorer */}
      <section aria-labelledby="multi-source-heading" className="space-y-2">
        <h2
          id="multi-source-heading"
          className="text-2xl font-bold text-slate-900 dark:text-slate-100"
        >
          Federal and Multi-Source Contracts
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Federal agencies like the VA, DoD, and HHS award contracts to Richmond vendors.
          Search across all sources to see the full scope of government spending.
        </p>
        <MultiSourceExplorer />
      </section>

      {/* Virginia State Contracts */}
      <section aria-labelledby="state-contracts-heading" className="space-y-2">
        <h2
          id="state-contracts-heading"
          className="text-2xl font-bold text-slate-900 dark:text-slate-100"
        >
          Virginia State Contracts (eVA)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          The Commonwealth of Virginia&apos;s electronic procurement system (eVA) tracks state-level
          contracts. These often include IT, facilities, and infrastructure spending.
        </p>
        <StateContracts />
      </section>
    </div>
  );
}
