"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FreshnessData {
  last_updated: string | null;
  source: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function DataBadge({ source = "City of Richmond Open Data" }: { source?: string }) {
  const [freshness, setFreshness] = useState<FreshnessData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/data-freshness`)
      .then((r) => r.json())
      .then((data: FreshnessData) => setFreshness(data))
      .catch(() => {
        // Silently fall back to static label if endpoint unreachable
      });
  }, []);

  const label = freshness?.last_updated
    ? `Data as of ${formatDate(freshness.last_updated)}`
    : `Source: ${source}`;

  return (
    <Badge variant="outline" className="text-sm px-3 py-1 gap-1.5">
      <Database className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}
