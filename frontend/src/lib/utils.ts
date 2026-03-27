import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value === 0) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

export function riskColor(level: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-800 border-red-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    attention: "bg-orange-100 text-orange-800 border-orange-300",
    ok: "bg-green-100 text-green-800 border-green-300",
    expired: "bg-gray-100 text-gray-600 border-gray-300",
    unknown: "bg-gray-100 text-gray-500 border-gray-300",
  };
  return colors[level] || colors.unknown;
}

export function riskLabel(level: string): string {
  const labels: Record<string, string> = {
    critical: "Expiring within 30 days",
    warning: "Expiring in 31-60 days",
    attention: "Expiring in 61-90 days",
    ok: "More than 90 days left",
    expired: "Already expired",
    unknown: "Date not available",
  };
  return labels[level] || level;
}

export function riskIcon(level: string): string {
  const icons: Record<string, string> = {
    critical: "alert-circle",
    warning: "alert-triangle",
    attention: "clock",
    ok: "check-circle",
    expired: "minus-circle",
    unknown: "help-circle",
  };
  return icons[level] || "help-circle";
}
