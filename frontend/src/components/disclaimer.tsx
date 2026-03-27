import { Database } from "lucide-react";

export function Disclaimer() {
  return (
    <div role="status" className="flex items-center gap-2 text-xs text-slate-500">
      <Database className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <p>
        Data from City of Richmond Open Data (Socrata). For informational purposes — not official City reporting.
      </p>
    </div>
  );
}
