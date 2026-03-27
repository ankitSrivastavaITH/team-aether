"use client";
import { useLocale } from "@/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { t } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, toggleLocale } = useLocale();

  return (
    <Button
      variant="ghost"
      onClick={toggleLocale}
      className="gap-2 h-10 px-3 text-sm"
      aria-label={`Switch to ${locale === "en" ? "Spanish" : "English"}`}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span>{t("lang.toggle", locale)}</span>
    </Button>
  );
}
