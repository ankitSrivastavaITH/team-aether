import Link from "next/link";
import { Shield, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          RVA Contract Lens
        </h1>
        <p className="text-xl text-[#475569] max-w-2xl mx-auto leading-relaxed">
          Richmond spends $6.1 billion in public contracts.
          Now you can see where it goes.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
        <Link
          href="/staff"
          className="flex flex-col items-center gap-3 p-8 bg-white border-2 border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:shadow-md transition-all focus:outline-none focus:ring-3 focus:ring-[#2563EB] focus:ring-offset-2 group"
        >
          <Shield className="h-10 w-10 text-[#2563EB]" aria-hidden="true" />
          <span className="text-lg font-semibold">Staff Dashboard</span>
          <span className="text-sm text-[#475569]">Track expiring contracts and manage risk</span>
          <ArrowRight className="h-5 w-5 text-[#2563EB] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>

        <Link
          href="/public"
          className="flex flex-col items-center gap-3 p-8 bg-white border-2 border-[#E2E8F0] rounded-xl hover:border-[#F97316] hover:shadow-md transition-all focus:outline-none focus:ring-3 focus:ring-[#F97316] focus:ring-offset-2 group"
        >
          <BarChart3 className="h-10 w-10 text-[#F97316]" aria-hidden="true" />
          <span className="text-lg font-semibold">Public Transparency</span>
          <span className="text-sm text-[#475569]">See where your tax dollars go</span>
          <ArrowRight className="h-5 w-5 text-[#F97316] group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      <p className="text-sm text-[#475569] max-w-lg">
        All data comes from the City of Richmond&apos;s public open data portal.
        This is an exploratory tool — not official City reporting.
      </p>
    </div>
  );
}
