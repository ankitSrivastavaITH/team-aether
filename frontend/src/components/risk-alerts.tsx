"use client";

import { AlertCircle, AlertTriangle, Clock, FileText, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RiskAlertsProps {
  totalContracts: number;
  totalValue: number;
  expiring30: number;
  expiring60: number;
  expiring90: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
  bgClass?: string;
}

function StatCard({ label, value, icon, colorClass = "text-slate-700", bgClass = "bg-white" }: StatCardProps) {
  return (
    <div
      className={`${bgClass} rounded-xl ring-1 ring-slate-200 p-5 flex flex-col gap-3`}
    >
      <div className={`flex items-center gap-2 ${colorClass}`}>
        {icon}
        <span className="text-base font-medium">{label}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}

export function RiskAlerts({ totalContracts, totalValue, expiring30, expiring60, expiring90 }: RiskAlertsProps) {
  return (
    <section role="region" aria-label="Contract risk summary">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Risk Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Contracts"
          value={totalContracts.toLocaleString()}
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          colorClass="text-slate-700"
          bgClass="bg-white"
        />
        <StatCard
          label="Total Value"
          value={formatCurrency(totalValue)}
          icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
          colorClass="text-slate-700"
          bgClass="bg-white"
        />
        <StatCard
          label="Expiring ≤30 days"
          value={expiring30.toLocaleString()}
          icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
          colorClass="text-red-700"
          bgClass="bg-red-50"
        />
        <StatCard
          label="Expiring ≤60 days"
          value={expiring60.toLocaleString()}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          colorClass="text-yellow-700"
          bgClass="bg-yellow-50"
        />
        <StatCard
          label="Expiring ≤90 days"
          value={expiring90.toLocaleString()}
          icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          colorClass="text-orange-700"
          bgClass="bg-orange-50"
        />
      </div>
    </section>
  );
}
