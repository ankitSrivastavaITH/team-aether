"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBadge } from "@/components/data-badge";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StateContract {
  source: string;
  contract_id: string;
  title: string;
  department: string;
  vendor: string;
  value: number;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  region: string;
}

interface StateContractsResponse {
  contracts: StateContract[];
  total: number;
  total_value: number;
  source: string;
}

const EVA_PORTAL_URL = "https://eva.virginia.gov/pages/eva-home.html";

function useStateContracts() {
  return useQuery<StateContractsResponse>({
    queryKey: ["state-contracts"],
    queryFn: () => fetchAPI<StateContractsResponse>("/api/contracts/state"),
    staleTime: 10 * 60 * 1000,
  });
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    "Information Technology": "bg-blue-100 text-blue-800",
    "Construction": "bg-orange-100 text-orange-800",
    "Medical Supplies": "bg-red-100 text-red-800",
    "Facility Management": "bg-green-100 text-green-800",
    "Vehicles": "bg-gray-100 text-gray-800",
    "Environmental Services": "bg-emerald-100 text-emerald-800",
    "Logistics": "bg-yellow-100 text-yellow-800",
    "Security Systems": "bg-purple-100 text-purple-800",
    "Utilities": "bg-cyan-100 text-cyan-800",
    "Healthcare": "bg-pink-100 text-pink-800",
  };
  const cls = colorMap[category] ?? "bg-slate-100 text-slate-800";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
      aria-label={`Category: ${category}`}
    >
      {category}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading state contracts" className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm"
    >
      <p className="font-semibold">Unable to load state contracts</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

export function StateContracts() {
  const { data, isLoading, isError, error } = useStateContracts();

  return (
    <section aria-labelledby="state-contracts-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="state-contracts-heading"
            className="text-2xl font-bold text-slate-900 dark:text-slate-100"
          >
            Virginia State Contracts (eVA)
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
            State procurement contracts relevant to the Richmond region from the Virginia eVA portal.
          </p>
        </div>
        <DataBadge source="Virginia eVA" />
      </div>

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-indigo-50 border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">State Contracts</p>
              <p className="text-3xl font-bold text-indigo-700 mt-1">
                {data.total.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Richmond-region contracts</p>
            </CardContent>
          </Card>
          <Card className="bg-violet-50 border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">Total State Value</p>
              <p className="text-3xl font-bold text-violet-700 mt-1">
                {formatCurrency(data.total_value)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Across all eVA contracts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <ErrorState
          message={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      )}

      {data && data.contracts.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label="Virginia state contracts table"
              >
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Vendor
                    </th>
                    <th
                      scope="col"
                      className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Region
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Dates
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Portal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.contracts.map((contract, idx) => (
                    <tr
                      key={contract.contract_id}
                      className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                        idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/60"
                      }`}
                    >
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                          {contract.title}
                        </p>
                        <p
                          className="text-xs text-slate-400 dark:text-slate-500 mt-0.5"
                          title={contract.description}
                        >
                          {contract.contract_id}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[180px]">
                        <span className="line-clamp-2">{contract.department}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {contract.vendor}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(contract.value)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CategoryBadge category={contract.category} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[140px]">
                        <span className="line-clamp-2">{contract.region}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        <span>{contract.start_date}</span>
                        <span className="mx-1 text-slate-300 dark:text-slate-600">–</span>
                        <span>{contract.end_date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={EVA_PORTAL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                          aria-label={`View ${contract.title} on Virginia eVA portal (opens in new tab)`}
                        >
                          eVA
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.contracts.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400 text-base">No state contract data available.</p>
      )}
    </section>
  );
}
