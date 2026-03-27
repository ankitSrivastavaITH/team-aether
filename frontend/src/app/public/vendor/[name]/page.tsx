"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Disclaimer } from "@/components/disclaimer";
import { DataBadge } from "@/components/data-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, DollarSign, FileText, Calendar, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

interface VendorData {
  supplier: string;
  contracts: Array<Record<string, unknown>>;
  count: number;
  total_value: number;
  first_contract: string | null;
  last_expiry: string | null;
  departments_served: number | string | unknown[];
}

export default function VendorDetailPage() {
  const params = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(params.name);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendor", decodedName],
    queryFn: () => fetchAPI<VendorData>(`/api/contracts/vendor/${encodeURIComponent(decodedName)}`),
  });

  if (isLoading) return <div className="py-12 text-center text-lg text-gray-500">Loading vendor details...</div>;
  if (error || !data) return <div className="py-12 text-center text-lg text-red-600">Could not load vendor details.</div>;

  const s = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{data.supplier}</h1>
          <div className="flex gap-2 mt-2">
            <DataBadge />
          </div>
        </div>
        <Link href="/public">
          <Button variant="outline" className="h-11 gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Transparency
          </Button>
        </Link>
      </div>

      <Disclaimer />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Vendor statistics">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Total Contracts</span>
          </div>
          <div className="text-2xl font-bold">{s.count}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            <span>Total Value</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(s.total_value)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <span>Departments Served</span>
          </div>
          <div className="text-2xl font-bold">{typeof s.departments_served === 'number' ? s.departments_served : Array.isArray(s.departments_served) ? s.departments_served.length : String(s.departments_served)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>Latest Expiry</span>
          </div>
          <div className="text-2xl font-bold">{formatDate(s.last_expiry)}</div>
        </Card>
      </div>

      {/* SAM.gov Debarment Check */}
      <DebarmentCheck supplier={decodedName} />

      {/* Contract list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Contracts</h2>
        {data.contracts.length === 0 ? (
          <p className="text-gray-500">No contracts found.</p>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-sm" role="table" aria-label="Vendor contracts">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Contract #</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Department</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Value</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Start</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Expires</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((c: Record<string, unknown>, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3 font-mono text-xs">{String(c.contract_number || "")}</td>
                    <td className="px-4 py-3">{String(c.department || "")}</td>
                    <td className="px-4 py-3">{formatCurrency(c.value as number)}</td>
                    <td className="px-4 py-3">{formatDate(c.start_date as string)}</td>
                    <td className="px-4 py-3">{formatDate(c.end_date as string)}</td>
                    <td className="px-4 py-3 max-w-[300px] truncate" title={String(c.description || "")}>{String(c.description || "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Source note */}
      <p className="text-xs text-gray-400 text-center">
        Data from City of Richmond Open Data (Socrata). Not official City financial reporting.
      </p>
    </div>
  );
}

// ─── Debarment Check Component ──────────────────────────

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
      <Card className="p-4 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <span className="text-sm text-slate-600">SAM.gov Debarment Check</span>
          </div>
          <Button
            variant="outline"
            onClick={runCheck}
            disabled={loading}
            className="h-10 gap-2"
            aria-label={`Check if ${supplier} is debarred on SAM.gov`}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking...</>
            ) : (
              <><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Run Check</>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${result?.debarred ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
      <div className="flex items-start gap-3">
        {result?.debarred ? (
          <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${result?.debarred ? "text-red-800" : "text-green-800"}`}>
              {result?.debarred ? "Exclusion Records Found" : "No Exclusion Records Found"}
            </span>
            <Badge variant="outline" className="text-xs">SAM.gov</Badge>
          </div>
          <p className={`text-sm ${result?.debarred ? "text-red-700" : "text-green-700"}`}>
            {result?.details}
          </p>
          {result?.disclaimer && (
            <p className="text-xs text-slate-400 mt-2">{result.disclaimer}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
