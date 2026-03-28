"use client";

import { useState, useCallback } from "react";

const FONT_SIZES = [
  { label: "A", value: "", title: "Default font size" },
  { label: "A+", value: "1.1em", title: "Medium font size" },
  { label: "A++", value: "1.2em", title: "Large font size" },
] as const;

export function FontSizeToggle() {
  const [sizeIndex, setSizeIndex] = useState(0);

  const cycle = useCallback(() => {
    setSizeIndex((prev) => {
      const next = (prev + 1) % FONT_SIZES.length;
      const size = FONT_SIZES[next];
      document.documentElement.style.fontSize = size.value;
      return next;
    });
  }, []);

  const current = FONT_SIZES[sizeIndex];

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center justify-center px-2.5 h-9 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      title={current.title}
      aria-label={`Font size: ${current.label}. Click to cycle.`}
    >
      {current.label}
    </button>
  );
}

export function HighContrastToggle() {
  const [active, setActive] = useState(false);

  const toggle = useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2.5 h-9 rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
      title={active ? "Disable high contrast" : "Enable high contrast"}
      aria-label={active ? "Disable high contrast mode" : "Enable high contrast mode"}
      aria-pressed={active}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
      </svg>
      <span className="hidden sm:inline">HC</span>
    </button>
  );
}
