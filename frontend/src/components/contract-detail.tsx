"use client";

import { AlertCircle, AlertTriangle, Clock, CheckCircle, MinusCircle, HelpCircle, X, Brain, ArrowRight, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, riskColor, riskLabel } from "@/lib/utils";
import type { Contract } from "@/hooks/use-contracts";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";

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
      <dd className="text-base text-slate-900 break-words">{value ?? "N/A"}</dd>
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

function AIParsedSection({ contractNumber }: { contractNumber: string }) {
  const { data, isLoading, isError } = useQuery<ParsedContractResponse>({
    queryKey: ["parsed-contract", contractNumber],
    queryFn: () => fetchAPI<ParsedContractResponse>(`/api/parser/parse/${encodeURIComponent(contractNumber)}`),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(contractNumber),
  });

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          AI-Parsed Details
        </h3>
      </div>

      {isLoading && (
        <div
          className="space-y-2"
          aria-busy="true"
          aria-label="Parsing contract description"
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"
            />
          ))}
          <p className="text-xs text-slate-400 dark:text-slate-500">Extracting structured fields…</p>
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-3"
        >
          Could not parse description at this time.
        </div>
      )}

      {!isLoading && !isError && data && !data.error && (
        <div className="space-y-4">
          {/* Solicitation + Procurement method badges row */}
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
      )}

      {!isLoading && !isError && data?.error && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{data.error}</p>
      )}
    </div>
  );
}

export function ContractDetail({ contract, open, onClose }: ContractDetailProps) {
  if (!contract) return null;

  const risk = contract.risk_level ?? "unknown";
  const riskColorClass = riskColor(risk);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pr-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <SheetTitle className="text-lg font-semibold text-slate-900 leading-tight">
                {(contract.supplier as string) ?? (contract.vendor_name as string) ?? (contract.contractor_name as string) ?? "Unknown Vendor"}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500">
                Contract #{(contract.contract_number as string) ?? contract.id}
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

        <Separator className="my-4" />

        <div className="px-4 pb-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
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
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
              <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {contract.description}
              </p>
            </div>
          )}

          {((contract.contract_number as string) ?? contract.id) && (
            <>
              <Separator className="my-5" />
              <AIParsedSection
                contractNumber={String((contract.contract_number as string) ?? contract.id)}
              />
            </>
          )}

          <Separator className="my-6" />

          <p className="text-sm text-slate-400">
            Source: City of Richmond Open Data (Socrata)
          </p>

          {/* RFP Matching Advisory */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>RFP Compliance Note:</strong> Before renewing or modifying this contract, verify that current terms match the original RFP/solicitation.
              Contract terms that have been amended may no longer align with the original procurement.
              Check the <a href="https://www.rva.gov/procurement-services" target="_blank" rel="noopener noreferrer" className="underline">OpenGov Procurement Portal</a> for the original solicitation.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
