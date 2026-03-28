"use client";

import { useState, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Loader2,
  CheckCircle,
  Printer,
  Info,
  Search,
  Scale,
  Bot,
  User,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";
import { VendorSelect } from "@/components/vendor-select";

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
// Manual check list metadata
// ---------------------------------------------------------------------------

const MANUAL_CHECKS = [
  {
    id: "ofac",
    name: "OFAC SDN List",
    description: "Search for vendor on Treasury's sanctions search tool",
    url: "https://sanctionssearch.ofac.treas.gov/",
    authority: "IEEPA; TWEA; various sanctions programs",
  },
  {
    id: "dhs",
    name: "DHS BOD List",
    description:
      "Binding Operational Directives identifying software and hardware requiring mitigation.",
    url: "https://www.cisa.gov/binding-operational-directives",
    authority: "FISMA; Homeland Security Act",
  },
  {
    id: "fbi",
    name: "FBI InfraGard",
    description:
      "Public-private partnership for critical infrastructure protection and threat intelligence.",
    url: "https://www.infragard.org/",
    authority: "Critical Infrastructure Protection",
  },
  {
    id: "ftc",
    name: "FTC Enforcement",
    description:
      "Federal Trade Commission enforcement cases for deceptive or unfair business practices.",
    url: "https://www.ftc.gov/legal-library/browse/cases-proceedings",
    authority: "FTC Act; various consumer protection statutes",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AutoCheckCard({
  title,
  description,
  loading,
  checked,
  flagged,
  detailText,
  extraNote,
}: {
  title: string;
  description: string;
  loading: boolean;
  checked: boolean;
  flagged: boolean;
  detailText?: string;
  extraNote?: string;
}) {
  let cardClass =
    "flex flex-col gap-2 rounded-lg border p-4 transition-colors duration-300 ";
  let iconEl: React.ReactNode;
  let statusText: string;
  let statusClass: string;

  if (loading) {
    cardClass +=
      "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900";
    iconEl = (
      <Loader2
        className="h-5 w-5 text-blue-500 animate-spin shrink-0"
        aria-hidden="true"
      />
    );
    statusText = "Checking…";
    statusClass = "text-slate-500 dark:text-slate-400";
  } else if (!checked) {
    cardClass +=
      "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900";
    iconEl = (
      <ShieldCheck
        className="h-5 w-5 text-slate-400 shrink-0"
        aria-hidden="true"
      />
    );
    statusText = "Not yet checked";
    statusClass = "text-slate-400";
  } else if (flagged) {
    cardClass +=
      "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40";
    iconEl = (
      <ShieldAlert
        className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0"
        aria-hidden="true"
      />
    );
    statusText = "FLAGGED";
    statusClass = "text-red-700 dark:text-red-400 font-semibold";
  } else {
    cardClass +=
      "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40";
    iconEl = (
      <CheckCircle
        className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0"
        aria-hidden="true"
      />
    );
    statusText = "CLEAR";
    statusClass = "text-green-700 dark:text-green-400 font-semibold";
  }

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {iconEl}
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </span>
        </div>
        <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-[10px] shrink-0">
          <Bot className="h-3 w-3 mr-1" aria-hidden="true" />
          Auto-checked
        </Badge>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      {extraNote && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          {extraNote}
        </p>
      )}
      {(checked || loading) && (
        <p className={`text-xs mt-1 ${statusClass}`}>{statusText}</p>
      )}
      {detailText && checked && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {detailText}
        </p>
      )}
    </div>
  );
}

function ManualCheckRow({
  id,
  name,
  description,
  url,
  authority,
  checked,
  onToggle,
}: {
  id: string;
  name: string;
  description: string;
  url: string;
  authority: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors duration-200 ${
        checked
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      }`}
    >
      {/* 44px touch target checkbox */}
      <label
        htmlFor={`manual-${id}`}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer"
      >
        <input
          id={`manual-${id}`}
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 cursor-pointer"
          aria-label={`Mark ${name} as manually verified`}
        />
      </label>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-semibold ${
              checked
                ? "text-green-800 dark:text-green-300 line-through"
                : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {name}
          </span>
          <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 text-[10px]">
            <User className="h-3 w-3 mr-1" aria-hidden="true" />
            Manual
          </Badge>
          {checked && (
            <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-[10px]">
              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5">
          Authority: {authority}
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 shrink-0 min-h-[44px] border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 transition-colors"
        aria-label={`Open ${name} in a new tab to verify`}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline font-medium">Verify</span>
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const [vendorName, setVendorName] = useState("");
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualChecked, setManualChecked] = useState<Record<string, boolean>>(
    {}
  );

  const runComplianceCheck = useCallback(async (supplier: string) => {
    setLoading(true);
    try {
      const data = await fetchAPI<ComplianceResult>(
        `/api/contracts/compliance-check/${encodeURIComponent(supplier)}`
      );
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleVendorChange(vendor: string) {
    setVendorName(vendor);
    setResult(null);
    setManualChecked({});
    if (vendor.trim()) {
      runComplianceCheck(vendor.trim());
    }
  }

  function toggleManual(id: string) {
    setManualChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handlePrint() {
    window.print();
  }

  function resetForm() {
    setVendorName("");
    setResult(null);
    setManualChecked({});
  }

  // Compute progress
  const totalLists = result?.total_lists ?? 7;
  const autoChecked = result?.auto_checked ?? 3;
  const manualNeeded = result?.manual_review_needed ?? 4;

  const autoPassCount = result
    ? [
        result.sam_check?.checked && !result.sam_check.debarred,
        result.fcc_check?.checked && !result.fcc_check.flagged,
        result.csl_check?.checked && !result.csl_check.flagged,
      ].filter(Boolean).length
    : 0;

  const manualDoneCount = Object.values(manualChecked).filter(Boolean).length;
  const completedChecks = autoPassCount + manualDoneCount;

  const anyAutoFlagged = result?.any_flagged ?? false;
  const allComplete =
    result !== null && manualDoneCount === manualNeeded && !anyAutoFlagged;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <ShieldCheck
            className="h-7 w-7 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          Compliance Verification
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Vendor eligibility check across 7 federal and state databases.{" "}
          <strong className="text-blue-700 dark:text-blue-300">
            3 checks run automatically;
          </strong>{" "}
          4 require manual verification.
        </p>
      </div>

      {/* Info card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info
              className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
              <p className="font-semibold">How this checklist works</p>
              <div className="flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <Badge className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
                    <Bot className="h-3 w-3 mr-1" aria-hidden="true" />
                    Auto-checked
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    SAM.gov, FCC List, and CSL run instantly when you select a
                    vendor.
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600">
                    <User className="h-3 w-3 mr-1" aria-hidden="true" />
                    Manual
                  </Badge>
                  <span className="text-blue-800 dark:text-blue-200">
                    OFAC, DHS, FBI, and FTC require staff to visit the linked
                    site and confirm.
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Input */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Search
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
              Select Vendor to Check
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VendorSelect
            value={vendorName}
            onChange={handleVendorChange}
            label="Vendor to Check"
            placeholder="Select a vendor to check..."
          />
        </CardContent>
      </Card>

      {/* Main results panel */}
      {vendorName && (
        <>
          {/* ── 1. Summary Banner ── */}
          <Card
            className={`border-2 ${
              anyAutoFlagged
                ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30"
                : allComplete
                ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30"
                : "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
            }`}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {vendorName}
                  </h3>
                  {loading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Running automatic checks…
                    </p>
                  ) : anyAutoFlagged ? (
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      Flagged on one or more automatic checks. Review required
                      before procurement.
                    </p>
                  ) : allComplete ? (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1 font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      All {totalLists} compliance checks complete — vendor
                      cleared for procurement consideration.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {result
                        ? `${autoPassCount} of ${autoChecked} auto checks passed. Complete ${manualNeeded - manualDoneCount} remaining manual verification${manualNeeded - manualDoneCount !== 1 ? "s" : ""} below.`
                        : "Automatic checks will appear shortly."}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {completedChecks}
                  </span>
                  <span className="text-slate-400">/</span>
                  <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">
                    {totalLists}
                  </span>
                </div>
              </div>

              {/* Segmented progress bar: auto segment + manual segment */}
              <div className="mt-4">
                <div
                  className="w-full flex rounded-full overflow-hidden h-3 bg-slate-200 dark:bg-slate-700"
                  role="progressbar"
                  aria-valuenow={completedChecks}
                  aria-valuemin={0}
                  aria-valuemax={totalLists}
                  aria-label={`${completedChecks} of ${totalLists} compliance checks complete`}
                >
                  {/* Auto section */}
                  <div
                    className={`h-3 transition-all duration-500 ${
                      anyAutoFlagged ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{
                      width: `${(autoPassCount / totalLists) * 100}%`,
                    }}
                  />
                  {/* Manual section */}
                  <div
                    className="h-3 bg-amber-400 transition-all duration-500"
                    style={{
                      width: `${(manualDoneCount / totalLists) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-2 rounded-sm bg-blue-500" />
                    Auto ({autoPassCount}/{autoChecked})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-2 rounded-sm bg-amber-400" />
                    Manual ({manualDoneCount}/{manualNeeded})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Automatic Checks ── */}
          <section aria-labelledby="auto-checks-heading">
            <div className="mb-3">
              <h2
                id="auto-checks-heading"
                className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
              >
                <Bot
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                Automatic Checks ({autoChecked} of {totalLists})
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                These are checked instantly when you select a vendor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* SAM.gov */}
              <AutoCheckCard
                title="SAM.gov Exclusions"
                description="Federal debarment and exclusion database. Checks if vendor is excluded from receiving federal contracts or benefits."
                loading={loading}
                checked={result?.sam_check?.checked ?? false}
                flagged={result?.sam_check?.debarred ?? false}
                detailText={result?.sam_check?.details}
              />

              {/* FCC Covered List */}
              <AutoCheckCard
                title="FCC Covered List"
                description="Covered communications equipment or services that pose a national security threat."
                loading={loading}
                checked={result?.fcc_check?.checked ?? false}
                flagged={result?.fcc_check?.flagged ?? false}
                detailText={result?.fcc_check?.details}
                extraNote="Checks against prohibited manufacturers: Huawei, ZTE, Hytera, Hikvision, Dahua"
              />

              {/* Consolidated Screening List */}
              <AutoCheckCard
                title="Consolidated Screening List"
                description="Combined export screening list from Commerce, State, and Treasury departments."
                loading={loading}
                checked={result?.csl_check?.checked ?? false}
                flagged={result?.csl_check?.flagged ?? false}
                detailText={result?.csl_check?.details}
              />
            </div>
          </section>

          {/* ── 3. Manual Verification ── */}
          <section aria-labelledby="manual-checks-heading">
            <div className="mb-3">
              <h2
                id="manual-checks-heading"
                className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
              >
                <User
                  className="h-5 w-5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                Manual Verification Required ({manualNeeded} of {totalLists})
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Click each link to verify, then check the box to confirm.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {MANUAL_CHECKS.map((item) => (
                <ManualCheckRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  url={item.url}
                  authority={item.authority}
                  checked={!!manualChecked[item.id]}
                  onToggle={() => toggleManual(item.id)}
                />
              ))}
            </div>
          </section>

          {/* ── 4. Overall Status Banner ── */}
          {(allComplete || anyAutoFlagged) && (
            <Card
              className={`border-2 ${
                anyAutoFlagged
                  ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/40"
                  : "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/40"
              }`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  {anyAutoFlagged ? (
                    <ShieldAlert
                      className="h-7 w-7 text-red-600 dark:text-red-400 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <ShieldCheck
                      className="h-7 w-7 text-green-600 dark:text-green-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <p
                      className={`text-base font-semibold ${
                        anyAutoFlagged
                          ? "text-red-800 dark:text-red-300"
                          : "text-green-800 dark:text-green-300"
                      }`}
                    >
                      {anyAutoFlagged
                        ? "Compliance issues found — review before proceeding"
                        : `All ${totalLists} compliance checks complete — vendor cleared for procurement consideration`}
                    </p>
                    {result?.recommendation && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {result.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 5. Footer ── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-11 gap-2"
              aria-label="Print compliance report"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print Report
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="h-11 gap-2"
              aria-label="Check a different vendor"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              New Check
            </Button>
          </div>

          {/* Virginia Code + Disclaimer */}
          <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Scale
                  className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Legal Authority
                  </p>
                  {result?.virginia_code_reference ? (
                    <p>{result.virginia_code_reference}</p>
                  ) : (
                    <p>
                      Virginia Code Section 2.2-4321 requires verification that
                      vendors are not debarred or suspended from receiving
                      public contracts. The Virginia Public Procurement Act
                      (VPPA) mandates responsible contractor determinations
                      before award.
                    </p>
                  )}
                  <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-2">
                    {result?.disclaimer ||
                      "This tool assists with compliance verification but does not constitute legal advice. Consult the City Attorney for procurement policy questions."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
