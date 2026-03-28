"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Activity,
  FileSearch,
  ClipboardCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContractStats } from "@/hooks/use-contracts";
import { t, getLocale } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UrgentContract {
  contract_number: string;
  supplier: string;
  department: string;
  value: number;
  days_to_expiry?: number;
  risk_level?: string;
}

interface Decision {
  contract_number: string;
  supplier: string;
  verdict: string;
  confidence: string;
  summary: string;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Decision-first dashboard
// ---------------------------------------------------------------------------

function StaffDashboardContent() {
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    const handleStorage = () => setLocaleState(getLocale());
    window.addEventListener("storage", handleStorage);
    // Also poll for same-tab changes (language toggle)
    const id = setInterval(handleStorage, 500);
    return () => { window.removeEventListener("storage", handleStorage); clearInterval(id); };
  }, []);

  const { data: stats, isLoading: statsLoading } = useContractStats();

  const { data: urgentData, isLoading: urgentLoading } = useQuery({
    queryKey: ["urgent-contracts"],
    queryFn: () =>
      fetchAPI<{ contracts: UrgentContract[]; total: number }>(
        "/api/contracts",
        { max_days: 90, limit: 200 },
      ),
    staleTime: 5 * 60 * 1000,
  });

  const { data: decisionsData } = useQuery({
    queryKey: ["recent-decisions"],
    queryFn: () =>
      fetchAPI<{ decisions: Decision[]; total: number }>("/api/decision"),
    staleTime: 2 * 60 * 1000,
  });

  const urgent = (urgentData?.contracts ?? []).sort(
    (a, b) => (a.days_to_expiry ?? 999) - (b.days_to_expiry ?? 999),
  );

  const critical = urgent.filter((c) => c.risk_level === "critical");
  const warning = urgent.filter((c) => c.risk_level === "warning");
  const attention = urgent.filter((c) => c.risk_level === "attention");

  const totalContracts = (stats?.total_contracts as number) ?? 0;
  const totalValue = (stats?.total_value as number) ?? 0;

  // Use actual filtered counts so badges match cards
  const exp30 = critical.length;
  const exp60 = warning.length;
  const exp90 = attention.length;

  const loading = statsLoading || urgentLoading;

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* HERO: What needs your attention RIGHT NOW                          */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {new Date().getHours() < 12 ? t("staff_greeting_morning", locale) : new Date().getHours() < 17 ? t("staff_greeting_afternoon", locale) : t("staff_greeting_evening", locale)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {totalContracts.toLocaleString()} contracts worth {formatCurrency(totalValue)} across the City of Richmond
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* URGENCY BANNER: The single most important thing                    */}
      {/* ----------------------------------------------------------------- */}
      {!loading && critical.length > 0 && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-900 dark:text-red-200">
                    {critical.length} contract{critical.length !== 1 ? "s" : ""} expire within 30 days
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Worth {formatCurrency(critical.reduce((s, c) => s + (c.value ?? 0), 0))} — decisions needed this week
                  </p>
                </div>
              </div>
              <Link
                href="/staff/decision"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer shrink-0"
                style={{ minHeight: 44 }}
              >
                <Zap className="h-4 w-4" /> Start Reviewing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && critical.length === 0 && (
        <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {t("no_critical", locale)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* THREE ACTION LANES: What to do today / this week / this month      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODAY: Critical */}
        <Card className="border-t-4 border-t-red-500">
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {t("decide_today", locale)}
                </h2>
              </div>
              <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                {exp30}
              </Badge>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
                </div>
              ) : critical.length > 0 ? (
                critical.slice(0, 4).map((c) => (
                  <Link
                    key={c.contract_number}
                    href={`/staff/decision?supplier=${encodeURIComponent(c.supplier)}&contract=${encodeURIComponent(c.contract_number)}`}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                      <p className="text-xs text-slate-400">{c.days_to_expiry} {t("days_left", locale)} · {formatCurrency(c.value)}</p>
                    </div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 group-hover:underline shrink-0">
                      {t("decide_today", locale).split(" ")[0]} <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">{t("all_clear", locale)}</p>
              )}
            </div>
            {critical.length > 4 && (
              <Link href="/staff/decision" className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
                View all {critical.length} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* THIS WEEK: Warning */}
        <Card className="border-t-4 border-t-amber-500">
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t("plan_this_week", locale)}
                </h2>
              </div>
              <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                {exp60}
              </Badge>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
                </div>
              ) : warning.length > 0 ? (
                warning.slice(0, 4).map((c) => (
                  <Link
                    key={c.contract_number}
                    href={`/staff/decision?supplier=${encodeURIComponent(c.supplier)}&contract=${encodeURIComponent(c.contract_number)}`}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                      <p className="text-xs text-slate-400">{c.days_to_expiry} {t("days_left", locale)} · {formatCurrency(c.value)}</p>
                    </div>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:underline shrink-0">
                      {t("plan_this_week", locale).split(" ")[0]} <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">Nothing upcoming</p>
              )}
            </div>
            {warning.length > 4 && (
              <Link href="/staff/contracts?max_days=60" className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                View all {warning.length} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* THIS MONTH: Attention */}
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {t("review_this_month", locale)}
                </h2>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                {exp90}
              </Badge>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
                </div>
              ) : attention.length > 0 ? (
                attention.slice(0, 4).map((c) => (
                  <Link
                    key={c.contract_number}
                    href="/staff/review"
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{c.supplier}</p>
                      <p className="text-xs text-slate-400">{c.days_to_expiry} {t("days_left", locale)} · {formatCurrency(c.value)}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline shrink-0">
                      {t("review_this_month", locale).split(" ")[0]} <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">All reviewed</p>
              )}
            </div>
            {attention.length > 4 && (
              <Link href="/staff/contracts?max_days=90" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View all {attention.length} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* QUICK ACTIONS: The 4 things staff actually DO                      */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
          {t("quick_actions", locale)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/staff/decision"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
            style={{ minHeight: 44 }}
          >
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t("decision_engine", locale)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t("analyze_contract", locale)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/staff/health"
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-200 group"
            style={{ minHeight: 44 }}
          >
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{t("health_scanner", locale)}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Portfolio overview</p>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/staff/compliance"
            className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 group"
            style={{ minHeight: 44 }}
          >
            <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">Compliance Check</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Verify a vendor</p>
            </div>
            <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/staff/cost-analysis"
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200 group"
            style={{ minHeight: 44 }}
          >
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Cost Analysis</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Compare vendor pricing</p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RECENT DECISIONS: Audit trail of staff-confirmed decisions         */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          Recent Decisions
        </h2>
        {(() => {
          const recentDecisions = (decisionsData?.decisions ?? []).slice(0, 3);
          if (recentDecisions.length === 0) {
            return (
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
                    No decisions recorded yet
                  </p>
                </CardContent>
              </Card>
            );
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentDecisions.map((d) => {
                const isStaff = d.confidence === "STAFF";
                const verdictColor =
                  d.verdict === "RENEW"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                    : d.verdict === "REBID"
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700";
                const timeAgo = d.created_at
                  ? (() => {
                      const diff = Date.now() - new Date(d.created_at).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 60) return `${mins}m ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })()
                  : "";
                return (
                  <Card key={`${d.contract_number}-${d.created_at}`} className="hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {d.supplier}
                        </p>
                        <Badge className={`shrink-0 text-[10px] border ${verdictColor}`}>
                          {d.verdict}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                        #{d.contract_number}
                        {isStaff && <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">(Staff confirmed)</span>}
                      </p>
                      {timeAgo && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      }
    >
      <StaffDashboardContent />
    </Suspense>
  );
}
