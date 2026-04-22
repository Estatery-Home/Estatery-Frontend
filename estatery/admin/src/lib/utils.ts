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
  void code;
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatGhanaCedi(amount: string | number, maximumFractionDigits = 2): string {
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    maximumFractionDigits,
  });
}

export function formatTrendPct(pct: number | null | undefined): {
  text: string;
  up: boolean;
} | null {
  if (pct == null || Number.isNaN(pct)) return null;
  const up = pct >= 0;
  return { text: `${up ? "+" : ""}${pct.toFixed(1)}%`, up };
}
