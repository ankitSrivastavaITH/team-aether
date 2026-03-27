"use client";

import { AlertCircle, AlertTriangle, Clock, CheckCircle, MinusCircle, HelpCircle, X } from "lucide-react";
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

interface ContractDetailProps {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
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
              <p className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                {contract.description}
              </p>
            </div>
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
