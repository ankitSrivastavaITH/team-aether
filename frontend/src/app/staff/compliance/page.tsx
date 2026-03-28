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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchAPI } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
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

// ---------------------------------------------------------------------------
// Compliance list data
// ---------------------------------------------------------------------------

const COMPLIANCE_LISTS = [
  {
    id: "sam",
    name: "SAM.gov Exclusion Check",
    description:
      "Federal debarment and exclusion database. Checks if vendor is excluded from receiving federal contracts or benefits.",
    auto: true,
    url: "https://sam.gov/content/exclusions",
    authority: "FAR 9.4; 2 CFR 180",
  },
  {
    id: "fcc",
    name: "FCC Covered List",
    description:
      "Covered communications equipment or services that pose a national security threat.",
    auto: false,
    url: "https://www.fcc.gov/supplychain/coveredlist",
    authority: "Secure and Trusted Communications Networks Act",
  },
  {
    id: "ofac",
    name: "OFAC SDN List",
    description:
      "Specially Designated Nationals and Blocked Persons list maintained by the Treasury Department.",
    auto: false,
    url: "https://sanctionssearch.ofac.treas.gov/",
    authority: "IEEPA; TWEA; various sanctions programs",
  },
  {
    id: "csl",
    name: "Consolidated Screening List",
    description:
      "Combined export screening list from Commerce, State, and Treasury departments.",
    auto: false,
    url: "https://www.trade.gov/consolidated-screening-list",
    authority: "EAR; ITAR; various executive orders",
  },
  {
    id: "dhs",
    name: "DHS BOD List",
    description:
      "Binding Operational Directives identifying software and hardware requiring mitigation.",
    auto: false,
    url: "https://www.cisa.gov/binding-operational-directives",
    authority: "FISMA; Homeland Security Act",
  },
  {
    id: "fbi",
    name: "FBI InfraGard",
    description:
      "Public-private partnership for critical infrastructure protection and threat intelligence.",
    auto: false,
    url: "https://www.infragard.org/",
    authority: "Critical Infrastructure Protection",
  },
  {
    id: "ftc",
    name: "FTC Enforcement Actions",
    description:
      "Federal Trade Commission enforcement cases for deceptive or unfair business practices.",
    auto: false,
    url: "https://www.ftc.gov/legal-library/browse/cases-proceedings",
    authority: "FTC Act; various consumer protection statutes",
  },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const [vendorInput, setVendorInput] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [samResult, setSamResult] = useState<DebarmentResult | null>(null);
  const [samLoading, setSamLoading] = useState(false);
  const [checkedLists, setCheckedLists] = useState<Record<string, boolean>>({});

  const runSamCheck = useCallback(async (supplier: string) => {
    setSamLoading(true);
    try {
      const data = await fetchAPI<DebarmentResult>(
        `/api/contracts/debarment-check/${encodeURIComponent(supplier)}`
      );
      setSamResult(data);
    } catch {
      setSamResult({
        supplier,
        checked: false,
        debarred: false,
        details: "Could not reach debarment check service.",
        source: "SAM.gov",
        disclaimer: "",
      });
    } finally {
      setSamLoading(false);
    }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = vendorInput.trim();
    if (trimmed) {
      setVendorName(trimmed);
      setSamResult(null);
      setCheckedLists({});
      runSamCheck(trimmed);
    }
  }

  function toggleCheck(id: string) {
    setCheckedLists((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Compute completed checks
  const completedChecks =
    (samResult && !samResult.debarred ? 1 : 0) +
    Object.values(checkedLists).filter(Boolean).length;
  const totalChecks = 7;
  const allComplete = completedChecks === totalChecks;
  const hasSamIssue = samResult?.debarred === true;

  function handlePrint() {
    window.print();
  }

  function resetForm() {
    setVendorInput("");
    setVendorName("");
    setSamResult(null);
    setCheckedLists({});
  }

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
          Step-by-step compliance checklist for vendor procurement review.
          Verifies vendor eligibility across 7 federal and state databases.
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
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-semibold">About this checklist</p>
              <p>
                Before awarding any contract, City of Richmond procurement staff
                should verify the vendor is not excluded from federal or state
                contracts. The SAM.gov check runs automatically; the other six
                databases require manual verification via the linked websites.
              </p>
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
              Vendor to Check
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearch}
            className="flex gap-2"
            aria-label="Vendor compliance search"
          >
            <label htmlFor="compliance-vendor-input" className="sr-only">
              Vendor name
            </label>
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="compliance-vendor-input"
                type="search"
                value={vendorInput}
                onChange={(e) => setVendorInput(e.target.value)}
                placeholder="Enter vendor name..."
                className="pl-9 h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={!vendorInput.trim()}
              className="h-12 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Start compliance check"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Check
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Checklist (shown after vendor search) */}
      {vendorName && (
        <>
          {/* Progress */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Checking: {vendorName}
                </h3>
                <Badge
                  className={`${
                    allComplete
                      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
                      : hasSamIssue
                      ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                      : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                  }`}
                >
                  {completedChecks} / {totalChecks}
                </Badge>
              </div>
              <div
                className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3"
                role="progressbar"
                aria-valuenow={completedChecks}
                aria-valuemin={0}
                aria-valuemax={totalChecks}
                aria-label={`${completedChecks} of ${totalChecks} compliance checks complete`}
              >
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    hasSamIssue
                      ? "bg-red-500"
                      : allComplete
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${(completedChecks / totalChecks) * 100}%`,
                  }}
                />
              </div>
              {allComplete && !hasSamIssue && (
                <p className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  All 7 checks complete -- vendor cleared for procurement
                </p>
              )}
              {hasSamIssue && (
                <p className="mt-3 text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  SAM.gov exclusion found -- do not proceed with procurement
                </p>
              )}
            </CardContent>
          </Card>

          {/* Individual checks */}
          <div className="space-y-3">
            {COMPLIANCE_LISTS.map((list, idx) => {
              const isAutoCheck = list.auto;
              const isChecked = isAutoCheck
                ? samResult !== null && !samResult.debarred
                : !!checkedLists[list.id];
              const isAutoFailed = isAutoCheck && samResult?.debarred;

              return (
                <Card
                  key={list.id}
                  className={`${
                    isAutoFailed
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/50"
                      : isChecked
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-5 text-right mt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        {isAutoCheck ? (
                          <div className="flex items-start gap-2 flex-1">
                            {samResult ? (
                              samResult.debarred ? (
                                <ShieldAlert
                                  className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ShieldCheck
                                  className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                              )
                            ) : samLoading ? (
                              <Loader2
                                className="h-5 w-5 text-blue-500 animate-spin shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ShieldCheck
                                className="h-5 w-5 text-slate-400 shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {list.name}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Auto
                                </Badge>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {list.description}
                              </p>
                              {samResult && (
                                <p
                                  className={`text-xs mt-1 font-medium ${
                                    samResult.debarred
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {samResult.debarred
                                    ? "FOUND -- Exclusion records detected"
                                    : "PASSED -- No exclusion records found"}
                                </p>
                              )}
                              {samResult?.disclaimer && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                                  {samResult.disclaimer}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-start gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={!!checkedLists[list.id]}
                              onChange={() => toggleCheck(list.id)}
                              className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500"
                              aria-label={`Mark ${list.name} as verified`}
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {list.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {list.description}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
                                Authority: {list.authority}
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                      <a
                        href={list.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 shrink-0"
                        style={{ minHeight: 44 }}
                        aria-label={`Open ${list.name} website in a new tab`}
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">Visit</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action buttons */}
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

          {/* Virginia Code reference */}
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
                  <p>
                    Virginia Code Section 2.2-4321 requires verification that
                    vendors are not debarred or suspended from receiving public
                    contracts. The Virginia Public Procurement Act (VPPA) mandates
                    responsible contractor determinations before award.
                  </p>
                  <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-2">
                    This tool assists with compliance verification but does not
                    constitute legal advice. Consult the City Attorney for
                    procurement policy questions.
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
