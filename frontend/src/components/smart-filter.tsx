"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

interface FilterState {
  search: string;
  maxDays: string;
  department: string;
}

interface SmartFilterProps {
  departments: string[];
  onApply: (filters: Partial<FilterState>) => void;
  onClear: () => void;
}

function parseFilterIntent(text: string, departments: string[]): Partial<FilterState> | "clear" | null {
  const lower = text.toLowerCase().trim();

  if (lower === "clear" || lower === "clear filters" || lower === "reset" || lower === "show all") {
    return "clear";
  }

  const result: Partial<FilterState> = {};

  // Match department names (fuzzy)
  for (const dept of departments) {
    if (lower.includes(dept.toLowerCase())) {
      result.department = dept;
      break;
    }
    // Partial match
    const words = dept.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && lower.includes(word)) {
        result.department = dept;
        break;
      }
    }
    if (result.department) break;
  }

  // Match expiry windows
  if (lower.includes("30 day") || lower.includes("this month") || lower.includes("expiring soon")) {
    result.maxDays = "30";
  } else if (lower.includes("60 day") || lower.includes("two month") || lower.includes("2 month")) {
    result.maxDays = "60";
  } else if (lower.includes("90 day") || lower.includes("three month") || lower.includes("3 month") || lower.includes("quarter")) {
    result.maxDays = "90";
  }

  // Match search terms
  const vendorMatch = lower.match(/(?:from|by|vendor|supplier|with)\s+(.+?)(?:\s+expir|\s+contract|$)/i);
  if (vendorMatch) {
    result.search = vendorMatch[1].trim();
  }

  // If nothing matched, use the whole text as search
  if (Object.keys(result).length === 0 && lower.length > 2) {
    result.search = text.trim();
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function SmartFilter({ departments, onApply, onClear }: SmartFilterProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit() {
    if (!input.trim()) return;

    const parsed = parseFilterIntent(input, departments);

    if (parsed === "clear") {
      onClear();
      setFeedback("Filters cleared");
      setInput("");
    } else if (parsed) {
      onApply(parsed);
      const parts: string[] = [];
      if (parsed.department) parts.push(`Department: ${parsed.department}`);
      if (parsed.maxDays) parts.push(`Expiring in ${parsed.maxDays} days`);
      if (parsed.search) parts.push(`Search: ${parsed.search}`);
      setFeedback(`Applied: ${parts.join(", ")}`);
      setInput("");
    } else {
      setFeedback("Could not understand. Try: 'Public Works expiring in 30 days' or 'clear filters'");
    }

    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" aria-hidden="true" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Type to filter: 'Public Utilities expiring in 30 days' or 'clear'"
          className="pl-9 h-11 text-sm bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-blue-300 min-h-[44px]"
          aria-label="Smart filter -- type natural language to set filters"
        />
      </div>
      {feedback && (
        <p className="text-xs text-blue-600 px-3 animate-in fade-in" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
