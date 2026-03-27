"use client";

import { useQuery } from "@tanstack/react-query";
import { VendorCard } from "@/components/vendor-card";
import { Disclaimer } from "@/components/disclaimer";
import { fetchAPI } from "@/lib/api";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n";

interface VendorStat {
  supplier: string;
  count: number;
  total_value: number;
}

interface PublicStats {
  total_contracts: number;
  total_value: number;
  expiring_30: number;
  expiring_60: number;
  expiring_90: number;
  departments: Array<{ department: string; count: number; total_value: number }>;
  top_vendors: VendorStat[];
}

export default function VendorsPage() {
  const { locale } = useLocale();
  const { data, isLoading } = useQuery<PublicStats>({
    queryKey: ["public-stats"],
    queryFn: () => fetchAPI<PublicStats>("/api/contracts/stats"),
    staleTime: 5 * 60 * 1000,
  });

  const topVendors = data?.top_vendors
    ? [...data.top_vendors]
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 20)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t("public.top20", locale)}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          {t("public.top20Desc", locale)}
        </p>
      </div>

      <Disclaimer locale={locale} />

      {isLoading ? (
        <div aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      ) : topVendors.length > 0 ? (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0"
          aria-label={t("public.topVendors", locale)}
        >
          {topVendors.map((vendor) => (
            <li key={vendor.supplier}>
              <VendorCard
                name={vendor.supplier}
                contractCount={vendor.count}
                totalValue={vendor.total_value}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-base">No vendor data available.</p>
      )}
    </div>
  );
}
