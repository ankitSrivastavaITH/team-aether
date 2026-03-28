"use client";

import { getLocale } from "@/lib/i18n";
import { useEffect, useState } from "react";

export function SkipLink() {
  const [label, setLabel] = useState("Skip to main content");

  useEffect(() => {
    const locale = getLocale();
    setLabel(locale === "es" ? "Saltar al contenido principal" : "Skip to main content");
  }, []);

  return (
    <a
      href="#main-content"
      className="absolute -top-10 left-2 z-[100] focus:top-2 transition-[top] bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {label}
    </a>
  );
}
