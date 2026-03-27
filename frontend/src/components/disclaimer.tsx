import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <div role="status" className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-900">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm leading-relaxed">
        <strong>Note:</strong> This is an exploratory tool, not official City financial reporting.
        Data source: City of Richmond Open Data (Socrata).
      </p>
    </div>
  );
}
