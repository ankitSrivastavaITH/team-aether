"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  MinusCircle,
  HelpCircle,
  X,
  Brain,
  ArrowRight,
  Info,

  ShieldAlert,
  Loader2,
  FileText,
  Scale,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, riskColor, riskLabel } from "@/lib/utils";
import type { Contract } from "@/hooks/use-contracts";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContractDetailProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
}

interface ParsedFields {
  solicitation_number: string | null;
  procurement_method: string | null;
  original_term: string | null;
  renewal_structure: string | null;
  total_possible_term: string | null;
  scope_summary: string | null;
  key_details: string[];
}

interface ParsedContractResponse {
  contract_number: string;
  raw_description: string;
  parsed: ParsedFields;
  supplier: string | null;
  department: string | null;
  value: number | null;
  disclaimer: string;
  error?: string;
}

interface SamCheck {
  checked: boolean;
  debarred: boolean;
  details: string;
}

interface FccCheck {
  checked: boolean;
  flagged: boolean;
  details: string;
}

interface CslCheck {
  checked: boolean;
  flagged: boolean;
  details: string;
}

interface ComplianceResult {
  supplier: string;
  sam_check: SamCheck;
  fcc_check: FccCheck;
  csl_check: CslCheck;
  federal_lists: Array<{ name: string; agency: string; result?: { checked?: boolean; flagged?: boolean; debarred?: boolean; details?: string } }>;
  total_lists: number;
  auto_checked: number;
  manual_review_needed: number;
  any_flagged: boolean;
  recommendation: string;
  virginia_code_reference: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function RiskIcon({ level }: { level: string }) {
  const props = { className: "h-4 w-4", "aria-hidden": true as const };
  switch (level) {
    case "critical":
      return <AlertCircle {...props} />;
    case "warning":
      return <AlertTriangle {...props} />;
    case "attention":
      return <Clock {...props} />;
    case "ok":
      return <CheckCircle {...props} />;
    case "expired":
      return <MinusCircle {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-base text-slate-900 dark:text-slate-100 break-words">{value ?? "N/A"}</dd>
    </div>
  );
}

function TermFlow({
  original,
  renewal,
  total,
}: {
  original: string | null;
  renewal: string | null;
  total: string | null;
}) {
  const steps = [
    { label: "Original term", value: original },
    { label: "Renewals", value: renewal },
    { label: "Total possible", value: total },
  ].filter((s) => s.value);

  if (steps.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1" aria-label="Contract term structure">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {step.label}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {step.value}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-3 shrink-0" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton({ lines = 3, label }: { lines?: number; label: string }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label={label}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"
        />
      ))}
      <p className="text-xs text-slate-400 dark:text-slate-500">Loading...</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-3"
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Details
// ---------------------------------------------------------------------------

function DetailsTab({ contract }: { contract: Contract }) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-y-4">
        <DetailRow label="Department" value={contract.department as string} />
        <DetailRow label="Contract Value" value={formatCurrency((contract.value as number) ?? (contract.amount as number) ?? (contract.contract_amount as number))} />
        <DetailRow label="Start Date" value={formatDate(contract.start_date as string)} />
        <DetailRow label="End Date / Expiry" value={formatDate((contract.end_date as string) ?? (contract.expiration_date as string))} />
        {(contract.days_to_expiry !== undefined || contract.days_until_expiry !== undefined) && (
          <DetailRow
            label="Days Until Expiry"
            value={
              (() => {
                const days = (contract.days_to_expiry ?? contract.days_until_expiry) as number | undefined;
                if (typeof days === "number") {
                  return days < 0
                    ? `Expired ${Math.abs(days)} days ago`
                    : `${days} days`;
                }
                return String(days);
              })()
            }
          />
        )}
        {typeof contract.contract_type === "string" && contract.contract_type && (
          <DetailRow label="Contract Type" value={contract.contract_type} />
        )}
        {typeof contract.status === "string" && contract.status && (
          <DetailRow label="Status" value={contract.status} />
        )}
      </dl>

      {typeof contract.description === "string" && contract.description && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
          <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {contract.description}
          </p>
        </div>
      )}

      <Separator />

      <p className="text-sm text-slate-400 dark:text-slate-500">
        Source: City of Richmond Open Data (Socrata)
      </p>

      {/* RFP Matching Advisory */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>RFP Compliance Note:</strong> Before renewing or modifying this contract, verify that current terms match the original RFP/solicitation.
          Contract terms that have been amended may no longer align with the original procurement.
          Check the <a href="https://www.rva.gov/procurement-services" target="_blank" rel="noopener noreferrer" className="underline">OpenGov Procurement Portal</a> for the original solicitation.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Compliance
// ---------------------------------------------------------------------------

function ComplianceStatusCard({
  title,
  isLoading,
  checked,
  flagged,
  details,
}: {
  title: string;
  isLoading: boolean;
  checked: boolean;
  flagged: boolean;
  details?: string;
}) {
  let cardClass =
    "flex items-start gap-3 rounded-lg border p-3 transition-colors duration-200 ";

  if (isLoading) {
    cardClass += "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900";
  } else if (!checked) {
    cardClass += "border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30";
  } else if (flagged) {
    cardClass += "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40";
  } else {
    cardClass += "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40";
  }

  return (
    <div className={cardClass}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0 mt-0.5" aria-hidden="true" />
      ) : !checked ? (
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
      ) : flagged ? (
        <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </span>
        {isLoading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Checking...</p>
        ) : !checked ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">API unavailable</p>
        ) : flagged ? (
          <p className="text-xs text-red-700 dark:text-red-400 font-semibold mt-0.5">
            FLAGGED{details && ` -- ${details}`}
          </p>
        ) : (
          <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-0.5">
            CLEAR
            {details && (
              <span className="font-normal text-slate-500 dark:text-slate-400"> -- {details}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function ComplianceTab({ supplier, enabled }: { supplier: string; enabled: boolean }) {
  const { data, isLoading, isError } = useQuery<ComplianceResult>({
    queryKey: ["compliance-check", supplier],
    queryFn: () =>
      fetchAPI<ComplianceResult>(
        `/api/contracts/compliance-check/${encodeURIComponent(supplier)}`
      ),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(supplier),
  });

  if (!supplier) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
        No supplier name available for compliance screening.
      </p>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton lines={3} label="Running compliance checks" />;
  }

  if (isError) {
    return <ErrorMessage message="Could not load compliance data at this time." />;
  }

  if (!data) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
        No compliance data available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning banner if anything is flagged */}
      {data.any_flagged && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            One or more checks flagged this vendor. Review required before procurement.
          </p>
        </div>
      )}

      {/* Check cards — render all 7 from federal_lists */}
      <div className="space-y-2">
        {/* Top 3: API-based checks */}
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Live API Checks</p>
        <ComplianceStatusCard title="SAM.gov Exclusions (GSA)" isLoading={false} checked={data.sam_check?.checked ?? false} flagged={Boolean(data.sam_check?.debarred)} details={data.sam_check?.details} />
        <ComplianceStatusCard title="FCC Covered List (FCC)" isLoading={false} checked={data.fcc_check?.checked ?? false} flagged={data.fcc_check?.flagged ?? false} details={data.fcc_check?.details} />
        <ComplianceStatusCard title="Consolidated Screening List (Commerce)" isLoading={false} checked={data.csl_check?.checked ?? false} flagged={data.csl_check?.flagged ?? false} details={data.csl_check?.details} />

        {/* Bottom 4: Keyword screening */}
        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mt-3">Automated Keyword Screening</p>
        {data.federal_lists?.slice(3).map((list, i) => {
          const r = list.result as Record<string, unknown> | undefined;
          return (
            <ComplianceStatusCard
              key={i + 3}
              title={`${list.name} (${list.agency})`}
              isLoading={false}
              checked={Boolean(r?.checked)}
              flagged={Boolean(r?.flagged)}
              details={String(r?.details || `Screened against known ${list.name} entries`)}
            />
          );
        }) ?? (
          <>
            <ComplianceStatusCard title="SAM.gov Exclusions" isLoading={false} checked={data.sam_check?.checked ?? false} flagged={data.sam_check?.debarred ?? false} details={data.sam_check?.details} />
            <ComplianceStatusCard title="FCC Covered List" isLoading={false} checked={data.fcc_check?.checked ?? false} flagged={data.fcc_check?.flagged ?? false} details={data.fcc_check?.details} />
            <ComplianceStatusCard title="Consolidated Screening List" isLoading={false} checked={data.csl_check?.checked ?? false} flagged={data.csl_check?.flagged ?? false} details={data.csl_check?.details} />
          </>
        )}
      </div>

      {/* Summary stats */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{data.auto_checked}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Auto-Checked</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{data.total_lists}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Lists</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{data.manual_review_needed}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Manual Needed</p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {data.recommendation && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
            Recommendation
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-200">{data.recommendation}</p>
        </div>
      )}

      {/* Virginia code reference */}
      {data.virginia_code_reference && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Ref: {data.virginia_code_reference}
        </p>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 pt-1">
        <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: AI Analysis
// ---------------------------------------------------------------------------

function AIAnalysisTab({ contractNumber, enabled }: { contractNumber: string; enabled: boolean }) {
  const { data, isLoading, isError } = useQuery<ParsedContractResponse>({
    queryKey: ["parsed-contract", contractNumber],
    queryFn: () => fetchAPI<ParsedContractResponse>(`/api/parser/parse/${encodeURIComponent(contractNumber)}`),
    staleTime: 10 * 60 * 1000,
    enabled: enabled && Boolean(contractNumber),
  });

  if (isLoading) {
    return <LoadingSkeleton lines={4} label="Parsing contract description" />;
  }

  if (isError) {
    return <ErrorMessage message="Could not parse contract description at this time." />;
  }

  if (!data || data.error) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
        {data?.error ?? "No AI analysis available for this contract."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Solicitation + Procurement method badges */}
      {(data.parsed.solicitation_number || data.parsed.procurement_method) && (
        <div className="flex flex-wrap gap-2">
          {data.parsed.solicitation_number && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-700"
              aria-label={`Solicitation number: ${data.parsed.solicitation_number}`}
            >
              {data.parsed.solicitation_number}
            </span>
          )}
          {data.parsed.procurement_method && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
              aria-label={`Procurement method: ${data.parsed.procurement_method}`}
            >
              {data.parsed.procurement_method}
            </span>
          )}
        </div>
      )}

      {/* Scope summary */}
      {data.parsed.scope_summary && (
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 rounded-md p-3">
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {data.parsed.scope_summary}
          </p>
        </div>
      )}

      {/* Term flow */}
      {(data.parsed.original_term || data.parsed.renewal_structure || data.parsed.total_possible_term) && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            Contract Duration
          </p>
          <TermFlow
            original={data.parsed.original_term}
            renewal={data.parsed.renewal_structure}
            total={data.parsed.total_possible_term}
          />
        </div>
      )}

      {/* Key details */}
      {data.parsed.key_details && data.parsed.key_details.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            Key Details
          </p>
          <ul className="space-y-1" aria-label="Key contract details">
            {data.parsed.key_details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 dark:bg-violet-500 shrink-0" aria-hidden="true" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI disclaimer */}
      <div className="flex items-start gap-1.5 pt-1">
        <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {data.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ContractDetail({ contract, open, onClose }: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState("details");

  if (!contract) return null;

  const risk = contract.risk_level ?? "unknown";
  const riskColorClass = riskColor(risk);
  const supplierName = String(
    (contract.supplier as string) ??
    (contract.vendor_name as string) ??
    (contract.contractor_name as string) ??
    ""
  );
  const contractNumber = String(
    (contract.contract_number as string) ?? contract.id ?? ""
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" showCloseButton={false} className="!w-[500px] !max-w-[90vw] overflow-y-auto !gap-0 p-0">
        <SheetHeader className="pr-12 px-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {supplierName || "Unknown Vendor"}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
                Contract #{contractNumber || contract.id}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close contract details"
              onClick={onClose}
              className="shrink-0 h-11 w-11 focus:ring-3 focus:ring-blue-500 focus:ring-offset-2"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${riskColorClass}`}>
              <RiskIcon level={risk} />
              <span>{riskLabel(risk)}</span>
            </span>
          </div>
        </SheetHeader>

        <Separator className="my-2" />

        <div className="px-5 pb-6">
          <Tabs defaultValue="details" onValueChange={setActiveTab}>
            <TabsList className="w-full sticky top-0 z-10 rounded-lg p-1">
              <TabsTrigger value="details" className="data-active:!bg-blue-600 data-active:!text-white data-active:shadow-sm rounded-md">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Details
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-active:!bg-blue-600 data-active:!text-white data-active:shadow-sm rounded-md">
                <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="ai-analysis" className="data-active:!bg-blue-600 data-active:!text-white data-active:shadow-sm rounded-md">
                <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <DetailsTab contract={contract} />
            </TabsContent>

            <TabsContent value="compliance" className="mt-4">
              <ComplianceTab
                supplier={supplierName}
                enabled={activeTab === "compliance"}
              />
            </TabsContent>

            <TabsContent value="ai-analysis" className="mt-4">
              <AIAnalysisTab
                contractNumber={contractNumber}
                enabled={activeTab === "ai-analysis"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
