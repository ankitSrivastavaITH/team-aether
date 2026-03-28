"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface VendorCardProps {
  name: string;
  contractCount: number;
  totalValue: number;
}

export function VendorCard({ name, contractCount, totalValue }: VendorCardProps) {
  const encodedName = encodeURIComponent(name);

  return (
    <Link
      href={`/public/vendor/${encodedName}`}
      className="group block rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 transition-all duration-150 hover:border-blue-600 dark:hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-[3px] focus:ring-blue-600 dark:focus:ring-blue-400 focus:ring-offset-2 min-h-[44px]"
      aria-label={`View contracts for ${name}: ${contractCount} contracts worth ${formatCurrency(totalValue)}`}
    >
      <p
        className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-3 line-clamp-2"
        aria-hidden="true"
      >
        {name}
      </p>
      <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">
        <span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{contractCount}</span>{" "}
          {contractCount === 1 ? "contract" : "contracts"}
        </span>
        <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">
          {formatCurrency(totalValue)}
        </span>
      </div>
    </Link>
  );
}
