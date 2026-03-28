"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge } from "@/components/data-badge";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface FederalContract {
  source: string;
  contract_id: string;
  title: string;
  department: string;
  agency: string;
  value: number | null;
  description: string;
  posted_date: string | null;
  response_deadline: string | null;
  type: string;
  set_aside: string;
  naics_code: string;
  classification_code: string;
  place_of_performance: string;
  active: string;
  url: string;
}

interface FederalContractsResponse {
  contracts: FederalContract[];
  total: number;
  total_value: number;
  source: string;
}

interface SourceStat {
  source: string;
  count: number;
  total_value: number;
}

interface MultiSourceStatsResponse {
  sources: SourceStat[];
}

function useFederalContracts() {
  return useQuery<FederalContractsResponse>({
    queryKey: ["federal-contracts"],
    queryFn: () => fetchAPI<FederalContractsResponse>("/api/contracts/federal"),
    staleTime: 5 * 60 * 1000,
  });
}

function useMultiSourceStats() {
  return useQuery<MultiSourceStatsResponse>({
    queryKey: ["multi-source-stats"],
    queryFn: () => fetchAPI<MultiSourceStatsResponse>("/api/contracts/multi-source-stats"),
    staleTime: 5 * 60 * 1000,
  });
}

const SOURCE_SECTION_IDS: Record<string, string> = {
  "City of Richmond": "city",
  "SAM.gov (Federal)": "federal",
  "eVA (Virginia)": "state",
};

function SourceSummaryCard({
  source,
  count,
  totalValue,
  bgClass,
  textClass,
}: {
  source: string;
  count: number;
  totalValue: number;
  bgClass: string;
  textClass: string;
}) {
  const sectionId = SOURCE_SECTION_IDS[source];
  const href = sectionId ? `#${sectionId}-contracts` : "#";

  return (
    <a
      href={href}
      className={`${bgClass} border-0 shadow-sm rounded-xl block transition-all hover:shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      aria-label={`${source}: ${count.toLocaleString()} contracts worth ${formatCurrency(totalValue)}. Click to view this data section.`}
    >
      <div className="pt-6 pb-6 flex flex-col items-center text-center gap-2 px-4">
        <p className="text-sm font-semibold text-[#475569] uppercase tracking-wide">{source}</p>
        <p className={`text-3xl font-bold leading-none tracking-tight ${textClass}`}>
          {count.toLocaleString()}
        </p>
        <p className="text-sm text-[#475569]">contracts</p>
        <p className={`text-lg font-semibold ${textClass}`}>{formatCurrency(totalValue)}</p>
        <p className="text-xs text-[#64748b]">total value</p>
        <p className="text-xs text-[#94a3b8] mt-1">Click to explore</p>
      </div>
    </a>
  );
}

function StackedSourceBar({ sources }: { sources: SourceStat[] }) {
  const total = sources.reduce((sum, s) => sum + (s.total_value || 0), 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    "City of Richmond": "#2563EB",
    "SAM.gov (Federal)": "#059669",
    "eVA (Virginia)": "#7c3aed",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#475569] uppercase tracking-wide">
        Combined Contract Value by Source
      </h3>
      <div
        className="flex rounded-lg overflow-hidden h-10"
        role="img"
        aria-label="Stacked bar chart of contract value by source"
      >
        {sources.map((s) => {
          const pct = ((s.total_value || 0) / total) * 100;
          return (
            <div
              key={s.source}
              style={{
                width: `${pct}%`,
                backgroundColor: colors[s.source] || "#94a3b8",
              }}
              title={`${s.source}: ${formatCurrency(s.total_value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        {sources.map((s) => {
          const pct = ((s.total_value || 0) / total) * 100;
          return (
            <div key={s.source} className="flex items-center gap-2 text-sm text-[#475569]">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: colors[s.source] || "#94a3b8" }}
                aria-hidden="true"
              />
              <span>
                {s.source}: {formatCurrency(s.total_value)}{" "}
                <span className="text-[#94a3b8]">({pct.toFixed(1)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SetAsideBadge({ value }: { value: string }) {
  if (!value) return null;
  return (
    <span className="inline-block text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">
      {value}
    </span>
  );
}

function TypeBadge({ value }: { value: string }) {
  if (!value) return null;
  const isAward = value.toLowerCase() === "award";
  return (
    <span
      className={`inline-block text-xs font-medium rounded px-1.5 py-0.5 ${
        isAward
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      {value}
    </span>
  );
}

function FederalContractsTable({ contracts }: { contracts: FederalContract[] }) {
  if (contracts.length === 0) {
    return (
      <p className="text-[#475569] text-sm py-4">No federal contracts available.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full text-sm" aria-label="Federal contracts from SAM.gov">
        <thead className="bg-[#F8FAFC] text-[#475569] text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Title</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Department / Agency</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Value</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Type</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Set-Aside</th>
            <th scope="col" className="px-4 py-3 text-left font-semibold">Posted</th>
            <th scope="col" className="px-4 py-3 text-center font-semibold">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {contracts.map((c, idx) => (
            <tr
              key={c.contract_id || idx}
              className="bg-white hover:bg-[#F8FAFC] transition-colors"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-[#1E293B] leading-snug max-w-xs">{c.title}</p>
                {c.description && (
                  <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2 max-w-xs">
                    {c.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="text-[#1E293B] font-medium">{c.department}</p>
                {c.agency && c.agency !== c.department && (
                  <p className="text-xs text-[#64748b]">{c.agency}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#1E293B] whitespace-nowrap">
                {c.value != null ? formatCurrency(c.value) : <span className="text-[#94a3b8]">—</span>}
              </td>
              <td className="px-4 py-3">
                <TypeBadge value={c.type} />
              </td>
              <td className="px-4 py-3">
                <SetAsideBadge value={c.set_aside} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[#475569]">
                {c.posted_date || <span className="text-[#94a3b8]">—</span>}
              </td>
              <td className="px-4 py-3 text-center">
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2563EB] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 rounded"
                    aria-label={`View ${c.title} on SAM.gov (opens in new tab)`}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">SAM.gov</span>
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MultiSourceExplorer() {
  const { data: federalData, isLoading: federalLoading, isError: federalError } =
    useFederalContracts();
  const { data: statsData, isLoading: statsLoading } = useMultiSourceStats();

  const isLoading = federalLoading || statsLoading;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading federal contract data" className="space-y-4">
        <div className="h-28 rounded-xl bg-[#E2E8F0] animate-pulse" />
        <div className="h-64 rounded-xl bg-[#E2E8F0] animate-pulse" />
      </div>
    );
  }

  if (federalError) {
    return (
      <div
        role="alert"
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm"
      >
        Federal contract data is temporarily unavailable. Please try again later.
      </div>
    );
  }

  const sources = statsData?.sources ?? [];
  const contracts = federalData?.contracts ?? [];
  const federalTotal = federalData?.total ?? 0;
  const federalValue = federalData?.total_value ?? 0;

  const citySource = sources.find((s) => s.source === "City of Richmond");
  const stateSource = sources.find((s) => s.source === "eVA (Virginia)");

  return (
    <div className="space-y-6">
      {/* Source comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {citySource && (
          <SourceSummaryCard
            source="City of Richmond"
            count={citySource.count}
            totalValue={citySource.total_value}
            bgClass="bg-blue-50"
            textClass="text-[#2563EB]"
          />
        )}
        <SourceSummaryCard
          source="SAM.gov (Federal)"
          count={federalTotal}
          totalValue={federalValue}
          bgClass="bg-emerald-50"
          textClass="text-[#059669]"
        />
        {stateSource && (
          <SourceSummaryCard
            source="eVA (Virginia)"
            count={stateSource.count}
            totalValue={stateSource.total_value}
            bgClass="bg-violet-50"
            textClass="text-[#7c3aed]"
          />
        )}
      </div>

      {/* Stacked bar */}
      {sources.length > 0 && (
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardContent className="pt-6 pb-6">
            <StackedSourceBar sources={sources} />
          </CardContent>
        </Card>
      )}

      {/* Data badges */}
      <div className="flex flex-wrap gap-3">
        <DataBadge source="City of Richmond Open Data" />
        <DataBadge source="SAM.gov (Federal Contracts)" />
        <DataBadge source="Virginia eVA" />
      </div>

      {/* Federal contracts table */}
      <Card id="federal-contracts" className="border border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-[#1E293B]">
            Federal Contracts in the Richmond Area
          </CardTitle>
          <p className="text-sm text-[#475569]">
            {federalTotal} contracts totaling{" "}
            <strong className="text-[#1E293B]">{formatCurrency(federalValue)}</strong> from SAM.gov federal
            opportunities and awards.
          </p>
        </CardHeader>
        <CardContent>
          <FederalContractsTable contracts={contracts} />
        </CardContent>
      </Card>
    </div>
  );
}
