"use client";

import { NLQueryBar } from "@/components/nl-query-bar";

export default function AskRichmondPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Ask Richmond
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Ask questions about city contracts in plain English. Our AI translates your
          question into a database query and returns results instantly.
        </p>
      </div>

      {/* NL Query Bar — full width, prominent */}
      <div className="max-w-3xl mx-auto w-full">
        <NLQueryBar />
      </div>
    </div>
  );
}
