"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  federal_lists: string[];
  total_lists: number;
  auto_checked: number;
  manual_review_needed: number;
  any_flagged: boolean;
  recommendation: string;
  virginia_code_reference: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Manual check metadata
// ---------------------------------------------------------------------------

const MANUAL_CHECKS = [
  {
    id: "ofac",
    name: "OFAC SDN List",
    url: "https://sanctionssearch.ofac.treas.gov/",
  },
  {
    id: "dhs",
    name: "DHS BOD List",
    url: "https://www.cisa.gov/binding-operational-directives",
  },
  {
    id: "fbi",
    name: "FBI InfraGard",
    url: "https://www.infragard.org/",
  },
  {
    id: "ftc",
    name: "FTC Enforcement",
    url: "https://www.ftc.gov/legal-library/browse/cases-proceedings",
  },
];

// ---------------------------------------------------------------------------
// Helper: compact status badge for auto-checks
// ---------------------------------------------------------------------------

function AutoBadge({
  label,
  loading,
  checked,
  flagged,
}: {
  label: string;
  loading: boolean;
  checked: boolean;
  flagged: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {label}
      </span>
    );
  }
  if (!checked) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        {label} ⚠
      </span>
    );
  }
  if (flagged) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
        <ShieldAlert className="h-3 w-3" aria-hidden="true" />
        {label} ❌
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
      <CheckCircle className="h-3 w-3" aria-hidden="true" />
      {label} ✅
    </span>
  );
}

// ---------------------------------------------------------------------------
// Expanded auto-check card (compact version)
// ---------------------------------------------------------------------------

function CompactAutoCard({
  title,
  loading,
  checked,
  flagged,
  detailText,
  url,
}: {
  title: string;
  loading: boolean;
  checked: boolean;
  flagged: boolean;
  detailText?: string;
  url?: string;
}) {
  let cardClass =
    "flex items-start gap-3 rounded-lg border p-3 transition-colors duration-200 ";

  if (loading) {
    cardClass +=
      "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900";
  } else if (!checked) {
    cardClass +=
      "border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30";
  } else if (flagged) {
    cardClass +=
      "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40";
  } else {
    cardClass +=
      "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40";
  }

  return (
    <div className={cardClass}>
      {loading ? (
        <Loader2
          className="h-4 w-4 text-blue-500 animate-spin shrink-0 mt-0.5"
          aria-hidden="true"
        />
      ) : !checked ? (
        <AlertTriangle
          className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"
          aria-hidden="true"
        />
      ) : flagged ? (
        <ShieldAlert
          className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
      ) : (
        <CheckCircle
          className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </span>
          <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-[10px] shrink-0">
            <Bot className="h-3 w-3 mr-1" aria-hidden="true" />
            Auto
          </Badge>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Checking…
          </p>
        ) : !checked ? (
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              API unavailable
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                Check manually
              </a>
            )}
          </div>
        ) : flagged ? (
          <p className="text-xs text-red-700 dark:text-red-400 font-semibold mt-0.5">
            FLAGGED
            {detailText && ` — ${detailText}`}
          </p>
        ) : (
          <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-0.5">
            CLEAR
            {detailText && (
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {" "}
                — {detailText}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ComplianceCheck({ supplier }: { supplier: string }) {
  const [expanded, setExpanded] = useState(false);
  const [manualChecked, setManualChecked] = useState<Record<string, boolean>>(
    {}
  );

  const { data, isLoading } = useQuery<ComplianceResult>({
    queryKey: ["compliance-check", supplier],
    queryFn: () =>
      fetchAPI<ComplianceResult>(
        `/api/contracts/compliance-check/${encodeURIComponent(supplier)}`
      ),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(supplier),
  });

  function toggleManual(id: string) {
    setManualChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Derive status for collapsed summary bar
  const anyFlagged = data?.any_flagged ?? false;
  const manualDone = Object.values(manualChecked).filter(Boolean).length;

  // Header status icon
  let headerIcon: React.ReactNode;
  let headerStatus: React.ReactNode;

  if (isLoading) {
    headerIcon = (
      <Loader2
        className="h-4 w-4 text-blue-500 animate-spin shrink-0"
        aria-hidden="true"
      />
    );
    headerStatus = (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Running checks…
      </span>
    );
  } else if (anyFlagged) {
    headerIcon = (
      <ShieldAlert
        className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0"
        aria-hidden="true"
      />
    );
    headerStatus = (
      <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
        Flagged — review required
      </span>
    );
  } else if (data) {
    headerIcon = (
      <ShieldCheck
        className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0"
        aria-hidden="true"
      />
    );
    headerStatus = (
      <span className="text-xs text-slate-600 dark:text-slate-400">
        3/7 auto-checked · {manualDone}/4 manual done
      </span>
    );
  } else {
    headerIcon = (
      <ShieldCheck
        className="h-4 w-4 text-slate-400 shrink-0"
        aria-hidden="true"
      />
    );
    headerStatus = (
      <span className="text-xs text-slate-400">Compliance check</span>
    );
  }

  return (
    <Card
      className={`transition-colors duration-300 ${
        anyFlagged
          ? "border-red-300 dark:border-red-700"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <CardContent className="pt-4 pb-4">
        {/* ── Collapsed summary bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {headerIcon}

          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Compliance:
          </span>

          {/* Auto-check badges */}
          {!isLoading && data ? (
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <AutoBadge
                label="FCC"
                loading={false}
                checked={data.fcc_check?.checked ?? false}
                flagged={data.fcc_check?.flagged ?? false}
              />
              <AutoBadge
                label="SAM"
                loading={false}
                checked={data.sam_check?.checked ?? false}
                flagged={data.sam_check?.debarred ?? false}
              />
              <AutoBadge
                label="CSL"
                loading={false}
                checked={data.csl_check?.checked ?? false}
                flagged={data.csl_check?.flagged ?? false}
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                |
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                {4 - manualDone} manual remaining
              </span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 flex-1">
              {headerStatus}
            </div>
          ) : (
            <div className="flex-1">{headerStatus}</div>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 shrink-0"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse compliance details" : "Expand compliance details"}
          >
            {expanded ? (
              <>
                Collapse{" "}
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              </>
            ) : (
              <>
                Expand{" "}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* ── Expanded detail section ── */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {/* Auto checks */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Bot className="h-3 w-3" aria-hidden="true" />
                Automatic Checks (3 of 7)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <CompactAutoCard
                  title="SAM.gov Exclusions"
                  loading={isLoading}
                  checked={data?.sam_check?.checked ?? false}
                  flagged={data?.sam_check?.debarred ?? false}
                  detailText={data?.sam_check?.details}
                  url="https://sam.gov/content/exclusions"
                />
                <CompactAutoCard
                  title="FCC Covered List"
                  loading={isLoading}
                  checked={data?.fcc_check?.checked ?? false}
                  flagged={data?.fcc_check?.flagged ?? false}
                  detailText={data?.fcc_check?.details}
                  url="https://www.fcc.gov/supplychain/coveredlist"
                />
                <CompactAutoCard
                  title="Consolidated Screening List"
                  loading={isLoading}
                  checked={data?.csl_check?.checked ?? false}
                  flagged={data?.csl_check?.flagged ?? false}
                  detailText={data?.csl_check?.details}
                  url="https://www.trade.gov/consolidated-screening-list"
                />
              </div>
            </div>

            {/* Manual checks */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                Manual Verification Required (4 of 7)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MANUAL_CHECKS.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors duration-200 ${
                      manualChecked[item.id]
                        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <label
                      htmlFor={`compliance-manual-${supplier}-${item.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      <input
                        id={`compliance-manual-${supplier}-${item.id}`}
                        type="checkbox"
                        checked={!!manualChecked[item.id]}
                        onChange={() => toggleManual(item.id)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 shrink-0"
                        aria-label={`Mark ${item.name} as manually verified`}
                      />
                      <span
                        className={`text-sm font-medium truncate ${
                          manualChecked[item.id]
                            ? "text-green-800 dark:text-green-300 line-through"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.name}
                      </span>
                    </label>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 shrink-0"
                      style={{ minHeight: 36 }}
                      aria-label={`Open ${item.name} in new tab`}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      Verify
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Flagged warning */}
            {anyFlagged && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle
                  className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  One or more auto-checks flagged this vendor. Review required
                  before procurement.
                </p>
              </div>
            )}

            {/* SAM flagged shortcut to check automatically if not checked */}
            {!isLoading && !data && supplier && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                Compliance data unavailable. Please use the{" "}
                <a
                  href="/staff/compliance"
                  className="underline text-blue-600 dark:text-blue-400"
                >
                  Compliance page
                </a>{" "}
                for a full check.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
