"use client";
import { useState, useEffect, useCallback } from "react";
import { type Locale, getLocale, setLocale as persistLocale } from "@/lib/i18n";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    persistLocale(l);
  }, []);

  const toggleLocale = useCallback(() => {
    const next = locale === "en" ? "es" : "en";
    setLocale(next);
  }, [locale, setLocale]);

  return { locale, setLocale, toggleLocale };
}
