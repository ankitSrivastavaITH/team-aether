"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  badge?: string;
  badgeClass?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  summary?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  badge,
  badgeClass,
  defaultOpen = false,
  children,
  summary,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg min-h-[44px]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {title}
            </h3>
            {!open && summary && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {summary}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <Badge
              className={
                badgeClass ||
                "text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
              }
            >
              {badge}
            </Badge>
          )}
          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
      {open && (
        <CardContent className="pt-0 pb-5 px-4 sm:px-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
