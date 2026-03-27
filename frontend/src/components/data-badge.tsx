import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

export function DataBadge({ source = "City of Richmond Open Data" }: { source?: string }) {
  return (
    <Badge variant="outline" className="text-sm px-3 py-1 gap-1.5">
      <Database className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Source: {source}</span>
    </Badge>
  );
}
