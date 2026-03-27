import { Database } from "lucide-react";
import { type Locale, t } from "@/lib/i18n";

export function Disclaimer({ locale = "en" }: { locale?: Locale }) {
  return (
    <div role="status" className="flex items-center gap-2 text-xs text-slate-500">
      <Database className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <p>{t("common.disclaimer", locale)}</p>
    </div>
  );
}
