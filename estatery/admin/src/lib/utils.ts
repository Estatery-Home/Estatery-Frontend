/**
 * Utility helpers used across the app.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names and resolves Tailwind conflicts.
 * clsx() joins strings/objects; twMerge() makes sure later classes override earlier ones
 * (e.g. "p-2 p-4" becomes "p-4" instead of both applying).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric amount for dashboard KPIs (host currency from API). */
export function formatDashboardCurrency(code: string, amount: string | number): string {
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  const formatted = Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
  const c = (code || "ghs").toLowerCase();
  if (c === "usd") return `$${formatted}`;
  if (c === "cfa") return `${formatted} CFA`;
  return `₵${formatted}`;
}

export function formatTrendPct(pct: number | null | undefined): {
  text: string;
  up: boolean;
} | null {
  if (pct == null || Number.isNaN(pct)) return null;
  const up = pct >= 0;
  return { text: `${up ? "+" : ""}${pct.toFixed(1)}%`, up };
}
