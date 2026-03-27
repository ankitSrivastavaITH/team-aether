"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Slide definitions
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Individual slide components
// ---------------------------------------------------------------------------

function Slide1() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 text-blue-300 text-sm font-semibold px-4 py-2 rounded-full uppercase tracking-widest mb-2">
        Hack for RVA 2026 &nbsp;·&nbsp; Track 1: A Thriving City Hall
      </div>
      <h1 className="text-7xl font-black text-white leading-none tracking-tight">
        RVA Contract Lens
      </h1>
      <p className="text-3xl font-light text-slate-300 max-w-3xl leading-snug">
        Richmond&apos;s{" "}
        <span className="text-blue-400 font-semibold">$6.76 Billion</span> in
        Public Contracts.
        <br />
        Made Visible.
      </p>
      <div className="mt-8 text-xl text-slate-400 font-medium tracking-wide">
        Team Aether
      </div>
    </div>
  );
}

function Slide2() {
  return (
    <div className="flex flex-col h-full px-12 py-10 gap-6">
      <h2 className="text-5xl font-bold text-white text-center mb-2">
        The Problem
      </h2>
      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Staff Pain */}
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🏛️</span>
            <h3 className="text-2xl font-bold text-red-300">Staff Pain</h3>
          </div>
          <p className="text-slate-300 text-xl leading-relaxed">
            A procurement officer downloads CSVs, opens Excel, scans 40-page
            PDFs.
          </p>
          <blockquote className="border-l-4 border-red-400 pl-5 text-slate-200 text-xl italic leading-relaxed">
            &ldquo;It took me <span className="text-red-300 font-bold not-italic">3 days</span> to
            renew one contract.&rdquo;
          </blockquote>
          <p className="text-slate-400 text-base mt-auto">
            — Deputy Director, City of Richmond
          </p>
        </div>
        {/* Resident Pain */}
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🏘️</span>
            <h3 className="text-2xl font-bold text-amber-300">Resident Pain</h3>
          </div>
          <p className="text-slate-300 text-xl leading-relaxed">
            $6.76 billion in contracts. No way to see where the money goes
            without a FOIA request.
          </p>
          <div className="mt-auto bg-amber-900/40 border border-amber-600/30 rounded-xl p-5">
            <p className="text-amber-200 text-2xl font-bold leading-snug">
              22 contracts expiring in 30 days.
            </p>
            <p className="text-amber-400 text-xl mt-1">No one gets an alert.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide3() {
  return (
    <div className="flex flex-col h-full px-12 py-10 gap-6">
      <h2 className="text-5xl font-bold text-white text-center mb-1">
        The Solution
      </h2>
      <p className="text-center text-2xl text-blue-300 font-medium mb-4">
        One app. Two audiences. Both problem statements.
      </p>
      <div className="grid grid-cols-2 gap-8 flex-1">
        {/* Staff side */}
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚙️</span>
            <h3 className="text-2xl font-bold text-blue-300">Staff Dashboard</h3>
          </div>
          {[
            "Risk alerts & expiring contract notifications",
            "Ask Richmond — natural language queries",
            "PDF extraction & vector search",
            "Anomaly detection across all contracts",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-blue-400 mt-1 shrink-0">✦</span>
              <p className="text-slate-200 text-lg leading-snug">{item}</p>
            </div>
          ))}
        </div>
        {/* Public side */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌐</span>
            <h3 className="text-2xl font-bold text-emerald-300">Public Portal</h3>
          </div>
          {[
            "Transparency explorer — search any contract",
            "Service navigator for residents",
            "Spending charts & vendor breakdowns",
            "MBE vendor diversity analysis",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 shrink-0">✦</span>
              <p className="text-slate-200 text-lg leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide4() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-12 gap-8">
      <h2 className="text-6xl font-bold text-white">Live Demo</h2>
      <p className="text-3xl text-slate-300 font-light">
        Let&apos;s see it in action
      </p>
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <Link
          href="/staff"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xl px-8 py-4 rounded-xl transition-colors min-h-[44px]"
        >
          <span>⚙️</span> Staff Dashboard →
        </Link>
        <Link
          href="/public"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xl px-8 py-4 rounded-xl transition-colors min-h-[44px]"
        >
          <span>🌐</span> Public Explorer →
        </Link>
        <Link
          href="/public/services"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xl px-8 py-4 rounded-xl transition-colors min-h-[44px]"
        >
          <span>🔍</span> Service Navigator →
        </Link>
      </div>
      <p className="text-slate-500 text-lg mt-4 italic">
        Switch to the live app — links open in a new tab
      </p>
    </div>
  );
}

function Slide5() {
  const sources = [
    { label: "City of Richmond", count: "1,365", color: "text-blue-400", bg: "bg-blue-950/40 border-blue-500/30" },
    { label: "Federal", count: "10", color: "text-red-400", bg: "bg-red-950/40 border-red-500/30" },
    { label: "State (Virginia)", count: "12", color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/30" },
    { label: "VITA", count: "8", color: "text-amber-400", bg: "bg-amber-950/40 border-amber-500/30" },
  ];

  return (
    <div className="flex flex-col items-center h-full px-12 py-10 gap-8">
      <h2 className="text-5xl font-bold text-white text-center">
        Data Sources
      </h2>
      <div className="grid grid-cols-4 gap-6 w-full">
        {sources.map(({ label, count, color, bg }) => (
          <div
            key={label}
            className={`${bg} border rounded-2xl p-6 flex flex-col items-center gap-2 text-center`}
          >
            <span className={`text-5xl font-black ${color}`}>{count}</span>
            <span className="text-slate-300 text-lg font-medium leading-snug">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-slate-800/60 border border-slate-600/30 rounded-2xl px-12 py-8 text-center flex flex-col gap-3">
        <p className="text-6xl font-black text-white">1,395 contracts</p>
        <p className="text-4xl font-bold text-blue-400">$6.76 Billion</p>
        <p className="text-slate-400 text-xl mt-1">All from public government data</p>
      </div>
    </div>
  );
}

function Slide6() {
  const innovations = [
    {
      icon: "💬",
      title: "NL-to-SQL",
      desc: '"Ask Richmond" — natural language contract queries',
      color: "border-blue-500/30 bg-blue-950/30",
      label: "text-blue-300",
    },
    {
      icon: "📄",
      title: "PDF Vector Search",
      desc: "ChromaDB semantic search across contract documents",
      color: "border-violet-500/30 bg-violet-950/30",
      label: "text-violet-300",
    },
    {
      icon: "⚠️",
      title: "Anomaly Detection",
      desc: "13 anomalies found across the full contract corpus",
      color: "border-amber-500/30 bg-amber-950/30",
      label: "text-amber-300",
    },
    {
      icon: "🤝",
      title: "MBE Diversity",
      desc: "Vendor diversity and minority business analysis",
      color: "border-emerald-500/30 bg-emerald-950/30",
      label: "text-emerald-300",
    },
    {
      icon: "🚫",
      title: "Federal Exclusions",
      desc: "7 vendors flagged against federal exclusion list",
      color: "border-red-500/30 bg-red-950/30",
      label: "text-red-300",
    },
  ];

  return (
    <div className="flex flex-col h-full px-12 py-10 gap-6">
      <h2 className="text-5xl font-bold text-white text-center mb-1">
        Innovation
      </h2>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {innovations.map(({ icon, title, desc, color, label }) => (
          <div
            key={title}
            className={`${color} border rounded-2xl p-6 flex flex-col gap-3`}
          >
            <span className="text-4xl">{icon}</span>
            <h3 className={`text-2xl font-bold ${label}`}>{title}</h3>
            <p className="text-slate-300 text-lg leading-snug">{desc}</p>
          </div>
        ))}
        <div className="bg-slate-800/60 border border-slate-600/30 rounded-2xl p-6 flex flex-col justify-center gap-2">
          <p className="text-slate-300 text-xl font-semibold leading-snug italic">
            &ldquo;Not a chatbot —
          </p>
          <p className="text-white text-2xl font-bold leading-snug">
            a structured routing engine&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function Slide7() {
  const features = [
    { icon: "♿", label: "WCAG 2.1 AA", desc: "Full accessibility compliance" },
    { icon: "🌎", label: "Spanish Support", desc: "Bilingual interface for all residents" },
    { icon: "👁️", label: "Screen Reader Friendly", desc: "ARIA labels on every interactive element" },
    { icon: "👆", label: "44px Touch Targets", desc: "Mobile-first, projector-ready design" },
    { icon: "🌐", label: "Public Transparency", desc: "No FOIA required — data always open" },
    { icon: "🤝", label: "MBE Analysis", desc: "Minority Business Enterprise participation tracking" },
  ];

  return (
    <div className="flex flex-col h-full px-12 py-10 gap-6">
      <h2 className="text-5xl font-bold text-white text-center mb-2">
        Equity &amp; Accessibility
      </h2>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {features.map(({ icon, label, desc }) => (
          <div
            key={label}
            className="bg-slate-800/50 border border-slate-600/30 rounded-2xl p-6 flex flex-col gap-3"
          >
            <span className="text-4xl">{icon}</span>
            <h3 className="text-2xl font-bold text-white">{label}</h3>
            <p className="text-slate-400 text-lg leading-snug">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide8() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-12 gap-7">
      <h2 className="text-5xl font-bold text-white">What&apos;s Next</h2>
      <blockquote className="max-w-3xl bg-slate-800/50 border border-slate-600/30 rounded-2xl px-10 py-7 text-2xl text-slate-200 italic leading-relaxed">
        &ldquo;The City of Richmond is{" "}
        <span className="text-blue-400 not-italic font-bold">
          not the sole purveyor
        </span>{" "}
        of needing such technology.&rdquo;
        <footer className="text-slate-400 text-lg not-italic mt-3 font-medium">
          — Deputy Director, City of Richmond
        </footer>
      </blockquote>
      <div className="grid grid-cols-3 gap-6 w-full max-w-4xl mt-2">
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-6 flex flex-col gap-2">
          <span className="text-3xl">🐳</span>
          <h3 className="text-xl font-bold text-blue-300">Docker Compose</h3>
          <p className="text-slate-400 text-lg leading-snug">
            Any city, any Socrata dataset
          </p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 flex flex-col gap-2">
          <span className="text-3xl">🏙️</span>
          <h3 className="text-xl font-bold text-emerald-300">Phase 1</h3>
          <p className="text-slate-400 text-lg leading-snug">
            Pilot with City procurement team
          </p>
        </div>
        <div className="bg-violet-950/40 border border-violet-500/30 rounded-2xl p-6 flex flex-col gap-2">
          <span className="text-3xl">🌆</span>
          <h3 className="text-xl font-bold text-violet-300">Phase 2</h3>
          <p className="text-slate-400 text-lg leading-snug">
            Multi-city expansion
          </p>
        </div>
      </div>
      <p className="text-2xl text-slate-300 font-light mt-2">
        This data was always public.{" "}
        <span className="text-blue-400 font-semibold">
          We just made it visible.
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide registry
// ---------------------------------------------------------------------------

const SLIDES: Slide[] = [
  { id: "title", content: <Slide1 /> },
  { id: "problem", content: <Slide2 /> },
  { id: "solution", content: <Slide3 /> },
  { id: "demo", content: <Slide4 /> },
  { id: "data", content: <Slide5 /> },
  { id: "innovation", content: <Slide6 /> },
  { id: "equity", content: <Slide7 /> },
  { id: "next", content: <Slide8 /> },
];

const SLIDE_LABELS = [
  "Title",
  "The Problem",
  "The Solution",
  "Live Demo",
  "Data Sources",
  "Innovation",
  "Equity & Access",
  "What's Next",
];

// ---------------------------------------------------------------------------
// Main PitchDeck page
// ---------------------------------------------------------------------------

export default function PitchDeckPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (animating) return;
      if (index < 0 || index >= SLIDES.length) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 280);
    },
    [animating]
  );

  const next = useCallback(() => goTo(current + 1, "next"), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, "prev"), [current, goTo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Track actual fullscreen state from browser events
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if a link/button is focused (let Enter/Space activate it)
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "A" || tag === "BUTTON") return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prev();
          break;
        case " ":
          e.preventDefault();
          next();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, toggleFullscreen]);

  // Slide transition classes
  const slideClass = animating
    ? direction === "next"
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-x-8"
    : "opacity-100 translate-x-0";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden"
      style={{ fontFamily: "var(--font-sans), Inter, system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-b border-slate-800/60 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-blue-400 font-bold text-lg tracking-tight">
            RVA Contract Lens
          </span>
          <span className="text-slate-600 text-sm">|</span>
          <span className="text-slate-400 text-sm">Hack for RVA 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm font-medium">
            {SLIDE_LABELS[current]}
          </span>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isFullscreen ? "⊡ Exit" : "⊞ F"}
          </button>
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors min-h-[44px] flex items-center"
          >
            ← App
          </Link>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={`absolute inset-0 transition-all duration-[280ms] ease-in-out ${slideClass}`}
          style={{ willChange: "opacity, transform" }}
        >
          {SLIDES[current].content}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="shrink-0 bg-slate-950/80 border-t border-slate-800/60 px-6 py-3 flex items-center justify-between z-10">
        {/* Prev button */}
        <button
          onClick={prev}
          disabled={current === 0}
          aria-label="Previous slide"
          className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 disabled:border-slate-800 min-h-[44px]"
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}: ${SLIDE_LABELS[i]}`}
              onClick={() => goTo(i, i > current ? "next" : "prev")}
              className={`rounded-full transition-all duration-200 min-h-[44px] flex items-center justify-center px-1`}
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  i === current
                    ? "w-6 h-3 bg-blue-400"
                    : "w-3 h-3 bg-slate-600 hover:bg-slate-400"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          disabled={current === SLIDES.length - 1}
          aria-label="Next slide"
          className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 disabled:border-slate-800 min-h-[44px]"
        >
          Next →
        </button>
      </div>

      {/* Keyboard hint — fades out */}
      <KeyboardHint />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard hint overlay
// ---------------------------------------------------------------------------

function KeyboardHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-600/50 text-slate-300 text-sm px-5 py-3 rounded-xl flex items-center gap-4 pointer-events-none transition-opacity duration-500">
      <span><kbd className="bg-slate-700 px-2 py-1 rounded text-xs">←</kbd> <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">→</kbd> Navigate</span>
      <span className="text-slate-500">|</span>
      <span><kbd className="bg-slate-700 px-2 py-1 rounded text-xs">Space</kbd> Next</span>
      <span className="text-slate-500">|</span>
      <span><kbd className="bg-slate-700 px-2 py-1 rounded text-xs">F</kbd> Fullscreen</span>
    </div>
  );
}
