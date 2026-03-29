"use client";
import Link from "next/link";
import {
  Shield,
  BarChart3,
  GitCompare,
  MessageSquare,
  AlertTriangle,
  FileSearch,
  Building2,
  Globe,
  Accessibility,
  FileText,
  TrendingUp,
  ArrowRight,
  Info,
} from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { WelcomeModal } from "@/components/welcome-modal";
import { StartTourButton } from "@/components/guided-tour";

const stats = [
  {
    icon: FileText,
    value: 1395,
    label: "Contracts",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: Globe,
    value: 8,
    label: "Data Sources",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    icon: Building2,
    value: 15,
    label: "Departments",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    icon: TrendingUp,
    value: 6.76,
    label: "Total Value (Billions)",
    prefix: "$",
    suffix: "B",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    isDecimal: true,
  },
];

const features = [
  {
    icon: MessageSquare,
    title: "Ask Richmond",
    description: "Query contracts in plain English — no SQL required.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900/50",
  },
  {
    icon: AlertTriangle,
    title: "AI Risk Alerts",
    description: "Automated warnings for expiring contracts and concentration risk.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900/50",
  },
  {
    icon: FileSearch,
    title: "PDF Analyzer",
    description: "Extract key terms, dates, and clauses from procurement documents.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
  {
    icon: BarChart3,
    title: "Vendor Analysis",
    description: "Visualize concentration risk and spending patterns by vendor.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900/50",
  },
  {
    icon: Globe,
    title: "Multi-Source",
    description: "City, Federal, State, and VITA contracts unified in one view.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-100 dark:border-cyan-900/50",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    description: "WCAG AA, Spanish language support, and screen reader friendly.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900/50",
  },
];

export function LandingContent() {
  return (
    <div className="flex flex-col items-center w-full gap-0">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="w-full text-center py-20 sm:py-28 px-4 relative overflow-hidden"
      >
        {/* Subtle gradient backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent dark:via-blue-700/40"
        />

        {/* Big animated dollar counter */}
        <p
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-blue-700 dark:text-blue-400 mb-4 leading-none"
          aria-live="polite"
          aria-label="$6,757,076,329 in public contracts"
        >
          $<AnimatedCounter end={6757076329} duration={2500} />
        </p>

        <h1
          id="hero-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4 max-w-4xl mx-auto text-balance"
        >
          Richmond&apos;s $6.76 Billion in Public Contracts.{" "}
          <span className="text-blue-600 dark:text-blue-400">Made Visible.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Track 1,395 contracts across City, Federal, and State sources. AI-powered analysis for
          staff. Transparent spending for residents.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-400/50 focus:ring-offset-2 min-h-[44px] active:scale-[0.98]"
          >
            <Shield className="h-5 w-5" aria-hidden="true" />
            Staff Dashboard
            <ArrowRight className="h-5 w-5 opacity-70" aria-hidden="true" />
          </Link>

          <Link
            href="/public"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2 min-h-[44px] active:scale-[0.98]"
          >
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Public Transparency
            <ArrowRight className="h-5 w-5 opacity-70" aria-hidden="true" />
          </Link>
        </div>

        {/* Guided Tour for Judges */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="animate-bounce text-purple-500">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase">Judges start here</p>
          <StartTourButton />
        </div>
      </section>

      {/* Stats Bar */}
      <section
        aria-label="Key statistics"
        className="w-full border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6"
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${stat.bg}`}
              >
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
                </div>
                <p className={`text-2xl font-black ${stat.color} tabular-nums`}>
                  {stat.isDecimal ? (
                    <span>
                      {stat.prefix}
                      {stat.value}
                      {stat.suffix}
                    </span>
                  ) : (
                    <AnimatedCounter
                      end={stat.value as number}
                      duration={1800}
                      prefix={stat.prefix ?? ""}
                      suffix={stat.suffix ?? ""}
                    />
                  )}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section
        aria-labelledby="features-heading"
        className="w-full max-w-5xl mx-auto px-4 py-16 sm:py-20"
      >
        <h2
          id="features-heading"
          className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-slate-50 mb-3"
        >
          Everything You Need to Understand City Spending
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto">
          Built for procurement staff and Richmond residents alike.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group flex flex-col gap-3 p-6 rounded-xl border ${feature.border} bg-white dark:bg-slate-900 hover:shadow-md dark:hover:shadow-slate-800/50 transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.bg} w-fit`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Social Proof Bar */}
      <section
        aria-label="Event information"
        className="w-full border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 py-5"
      >
        <p className="text-center text-white/90 font-medium text-sm sm:text-base tracking-wide px-4">
          Built for{" "}
          <span className="font-bold text-white">Hack for RVA 2026</span>
          <span className="mx-3 opacity-50">|</span>
          Track 1: A Thriving City Hall
        </p>
      </section>

      {/* Footer Links */}
      <section
        aria-label="Additional resources"
        className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-6">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-md"
            >
              <GitCompare className="h-4 w-4" aria-hidden="true" />
              Compare to old way
            </Link>
            <Link
              href="/public"
              className="inline-flex items-center gap-1.5 hover:text-orange-600 dark:hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Public spending view
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-md"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              About
            </Link>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center sm:text-right max-w-xs">
            Data from City of Richmond Open Data, USASpending.gov, VA eVA, and VITA. Not official
            City reporting.
          </p>
        </div>
      </section>

      <WelcomeModal />
    </div>
  );
}
