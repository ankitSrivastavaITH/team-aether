"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Disclaimer } from "@/components/disclaimer";
import { DataBadge } from "@/components/data-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Heart,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VendorData {
  supplier: string;
  contracts: Array<Record<string, unknown>>;
  count: number;
  total_value: number;
  first_contract: string | null;
  last_expiry: string | null;
  departments_served: number | string | unknown[];
}

// ---------------------------------------------------------------------------
// Vendor Health Indicator
// ---------------------------------------------------------------------------

interface HealthStatus {
  level: "good" | "caution" | "at-risk";
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

function computeVendorHealth(data: VendorData): HealthStatus {
  const contracts = data.contracts;
  const now = new Date();

  // Count contracts expiring within 30 days
  let expiringSoon = 0;
  let expired = 0;
  for (const c of contracts) {
    const endDate = c.end_date as string | null;
    if (endDate) {
      const end = new Date(endDate);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) expired++;
      else if (daysLeft <= 30) expiringSoon++;
    }
  }

  const deptsServed = typeof data.departments_served === "number"
    ? data.departments_served
    : Array.isArray(data.departments_served)
      ? data.departments_served.length
      : 1;

  // Determine health
  const expiringRatio = data.count > 0 ? (expiringSoon + expired) / data.count : 0;

  if (expiringRatio > 0.5 || expiringSoon > 3) {
    return {
      level: "at-risk",
      label: "At Risk",
      description: `${expiringSoon} contract${expiringSoon !== 1 ? "s" : ""} expiring within 30 days${expired > 0 ? `, ${expired} already expired` : ""}. Renewal action may be needed soon.`,
      color: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
      borderColor: "border-red-200 dark:border-red-800",
      icon: AlertTriangle,
    };
  }

  if (expiringSoon > 0 || expired > 0) {
    return {
      level: "caution",
      label: "Needs Attention",
      description: `${expiringSoon > 0 ? `${expiringSoon} contract${expiringSoon !== 1 ? "s" : ""} expiring soon` : ""}${expiringSoon > 0 && expired > 0 ? " and " : ""}${expired > 0 ? `${expired} expired` : ""}. Diversified across ${deptsServed} department${deptsServed !== 1 ? "s" : ""}.`,
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
      borderColor: "border-amber-200 dark:border-amber-800",
      icon: AlertTriangle,
    };
  }

  return {
    level: "good",
    label: "Healthy",
    description: `No contracts expiring soon. Active across ${deptsServed} department${deptsServed !== 1 ? "s" : ""} with ${data.count} contract${data.count !== 1 ? "s" : ""}.`,
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
    borderColor: "border-green-200 dark:border-green-800",
    icon: CheckCircle,
  };
}

function VendorHealthCard({ data }: { data: VendorData }) {
  const health = computeVendorHealth(data);
  const Icon = health.icon;

  return (
    <Card className={`${health.bgColor} ${health.borderColor}`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${health.bgColor} flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${health.color}`} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className={`h-4 w-4 ${health.color}`} aria-hidden="true" />
              <span className={`font-semibold text-sm ${health.color}`}>
                Vendor Health: {health.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {health.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Debarment Check
// ---------------------------------------------------------------------------

interface DebarmentResult {
  supplier: string;
  checked: boolean;
  debarred: boolean;
  matches?: number;
  details: string;
  source: string;
  disclaimer: string;
}

function DebarmentCheck({ supplier }: { supplier: string }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebarmentResult | null>(null);

  async function runCheck() {
    setLoading(true);
    try {
      const data = await fetchAPI<DebarmentResult>(
        `/api/contracts/debarment-check/${encodeURIComponent(supplier)}`
      );
      setResult(data);
      setChecked(true);
    } catch {
      setResult({
        supplier,
        checked: false,
        debarred: false,
        details: "Could not reach debarment check service.",
        source: "SAM.gov",
        disclaimer: "",
      });
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SAM.gov Debarment Check</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verify this vendor is not excluded from federal contracts.</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={runCheck}
              disabled={loading}
              className="h-11 gap-2"
              aria-label={`Check if ${supplier} is debarred on SAM.gov`}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Run Check</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${result?.debarred ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50" : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50"}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          {result?.debarred ? (
            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${result?.debarred ? "text-red-800 dark:text-red-300" : "text-green-800 dark:text-green-300"}`}>
                {result?.debarred ? "Exclusion Records Found" : "No Exclusion Records Found"}
              </span>
              <Badge variant="outline" className="text-xs">SAM.gov</Badge>
            </div>
            <p className={`text-sm ${result?.debarred ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
              {result?.details}
            </p>
            {result?.disclaimer && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{result.disclaimer}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function VendorDetailPage() {
  const params = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(params.name);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendor", decodedName],
    queryFn: () => fetchAPI<VendorData>(`/api/contracts/vendor/${encodeURIComponent(decodedName)}`),
  });

  // Derive department breakdown
  const deptBreakdown = useMemo(() => {
    if (!data?.contracts) return [];
    const map = new Map<string, { count: number; value: number }>();
    for (const c of data.contracts) {
      const dept = String(c.department || "Unknown");
      const existing = map.get(dept) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += (c.value as number) || 0;
      map.set(dept, existing);
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading vendor details" className="space-y-6">
        <div className="h-12 w-1/3 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="py-12 text-center text-lg text-red-600 dark:text-red-400">
        Could not load vendor details. Please try again later.
      </div>
    );
  }

  const s = data;
  const deptCount = typeof s.departments_served === "number"
    ? s.departments_served
    : Array.isArray(s.departments_served)
      ? s.departments_served.length
      : String(s.departments_served);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.supplier}</h1>
          <div className="flex gap-2 mt-2">
            <DataBadge />
          </div>
        </div>
        <Link href="/public/vendors">
          <Button
            variant="outline"
            className="h-11 gap-2 focus:ring-[3px] focus:ring-blue-600 focus:ring-offset-2"
            aria-label="Back to vendor list"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Vendors
          </Button>
        </Link>
      </div>

      <Disclaimer />

      {/* Vendor Health Indicator */}
      <VendorHealthCard data={data} />

      {/* Stats cards */}
      <section aria-label="Vendor statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>Total Contracts</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.count}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                <span>Total Value</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(s.total_value)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Departments Served</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{deptCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>Latest Expiry</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatDate(s.last_expiry)}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Department breakdown */}
      {deptBreakdown.length > 1 && (
        <section aria-labelledby="dept-breakdown-heading">
          <h2 id="dept-breakdown-heading" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Department Breakdown
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Which city departments use this vendor, and how much they spend.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptBreakdown.map((dept) => (
              <Link
                key={dept.name}
                href={`/public/department/${encodeURIComponent(dept.name)}`}
                className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: 44 }}
              >
                <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dept.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dept.count} contract{dept.count !== 1 ? "s" : ""} -- {formatCurrency(dept.value)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SAM.gov Debarment Check */}
      <DebarmentCheck supplier={decodedName} />

      {/* Contract list */}
      <section aria-labelledby="contracts-heading">
        <h2 id="contracts-heading" className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
          All Contracts ({data.contracts.length.toLocaleString()})
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Every contract held by this vendor, sorted by most recent.
        </p>
        {data.contracts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No contracts found.</p>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto">
            <table className="w-full text-sm" role="table" aria-label="Vendor contracts">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Contract #</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Department</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Value</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Start</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Expires</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((c: Record<string, unknown>, i: number) => (
                  <tr
                    key={i}
                    className={i % 2 === 0
                      ? "bg-white dark:bg-slate-800"
                      : "bg-slate-50 dark:bg-slate-900"
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{String(c.contract_number || "")}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/public/department/${encodeURIComponent(String(c.department || ""))}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 rounded"
                      >
                        {String(c.department || "")}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(c.value as number)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(c.start_date as string)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(c.end_date as string)}</td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-500 dark:text-slate-400" title={String(c.description || "")}>{String(c.description || "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Disclaimer />
        <DataBadge />
      </div>
    </div>
  );
}
