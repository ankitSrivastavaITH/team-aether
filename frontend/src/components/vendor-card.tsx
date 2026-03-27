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
      className="group block rounded-xl bg-white border border-[#E2E8F0] p-5 transition-all duration-150 hover:border-[#2563EB] hover:shadow-md focus:outline-none focus:ring-[3px] focus:ring-[#2563EB] focus:ring-offset-2 min-h-[44px]"
      aria-label={`View contracts for ${name}: ${contractCount} contracts worth ${formatCurrency(totalValue)}`}
    >
      <p
        className="font-bold text-base text-[#1E293B] group-hover:text-[#2563EB] transition-colors leading-snug mb-3 line-clamp-2"
        aria-hidden="true"
      >
        {name}
      </p>
      <div className="flex flex-col gap-1 text-sm text-[#475569]" aria-hidden="true">
        <span>
          <span className="font-semibold text-[#1E293B]">{contractCount}</span>{" "}
          {contractCount === 1 ? "contract" : "contracts"}
        </span>
        <span className="font-semibold text-lg text-[#1E293B]">
          {formatCurrency(totalValue)}
        </span>
      </div>
    </Link>
  );
}
