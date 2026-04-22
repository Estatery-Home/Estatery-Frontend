"use client";

/**
 * Listings chart – rent vs sale by week/month/year.
 * Premium visualization with gradients, glassmorphism, and animations.
 */
import * as React from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostListingsChart } from "@/lib/api-types";

/** Time range for chart: weekly (7 days), monthly (6 buckets), or yearly (4 quarters) */
type Range = "weekly" | "monthly" | "yearly";

const WEEKLY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const YEARLY_LABELS = ["Q1", "Q2", "Q3", "Q4"];

/** Mock data: rent and sale counts per day of week */
const weeklyData = WEEKLY_LABELS.map((label, i) => ({
  label,
  rent: [72, 89, 95, 109, 98, 85, 90][i] ?? 90,
  sale: [28, 35, 42, 45, 38, 32, 40][i] ?? 38,
}));

const monthlyData = [
  { label: "1 - 5", rent: 420, sale: 400 },
  { label: "6 - 10", rent: 380, sale: 600 },
  { label: "11 - 15", rent: 509, sale: 345 },
  { label: "16 - 20", rent: 520, sale: 220 },
  { label: "21 - 25", rent: 480, sale: 290 },
  { label: "26 - 30", rent: 650, sale: 410 },
];

/** Mock data: rent and sale counts per quarter */
const yearlyData = YEARLY_LABELS.map((label, i) => ({
  label,
  rent: [320, 480, 610, 590][i] ?? 375,
  sale: [120, 245, 360, 250][i] ?? 144,
}));

/** Return the data array for the selected time range */
function getData(range: Range) {
  switch (range) {
    case "weekly":
      return weeklyData;
    case "monthly":
      return monthlyData;
    case "yearly":
      return yearlyData;
  }
}

function getApiData(listingsChart: HostListingsChart | null, range: Range) {
  if (listingsChart?.[range]?.length) return listingsChart[range];
  return getData(range);
}

type ListingsChartProps = {
  listingsChart: HostListingsChart | null;
  loading?: boolean;
  onRefresh?: () => void;
};

export function ListingsChart({ listingsChart, loading, onRefresh }: ListingsChartProps) {
  const [range, setRange] = React.useState<Range>("monthly");
  const [animating, setAnimating] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const data = getApiData(listingsChart, range);
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.rent, d.sale]));
  const scaleMax = Math.max(5, Math.ceil(maxVal / 5) * 5);
  const yLabelCount = 5;
  const yLabels = Array.from({ length: yLabelCount + 1 }, (_, i) =>
    String(Math.round((scaleMax * (yLabelCount - i)) / yLabelCount))
  );
  const periodTotal = data.reduce((s, d) => s + d.rent + d.sale, 0);
  const avgVal =
    data.length > 0
      ? data.reduce((s, d) => s + (d.rent + d.sale) / 2, 0) / data.length
      : 0;

  const handleRefresh = () => {
    setAnimating(true);
    onRefresh?.();
    window.setTimeout(() => setAnimating(false), 600);
  };

  return (
    <div className="flex min-h-[260px] flex-col rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:min-h-[300px] transition-all duration-300 hover:shadow-md">
      {/* Header: title left, dropdown + refresh right */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Total Listings Overview</h3>
          <p className="text-sm text-slate-500 mt-0.5">Track your rental and sales performance</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-10 text-sm font-medium text-slate-700 transition-all cursor-pointer group-hover:bg-slate-100 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-slate-600 w-4 h-4" aria-hidden />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm hover:border-blue-100 active:scale-95"
            aria-label="Refresh chart"
          >
            <RefreshCw className={cn("w-4 h-4", animating && "animate-spin text-blue-600")} />
          </button>
        </div>
      </div>

      {/* Stats and Legend */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "text-2xl font-extrabold text-slate-900 tracking-tight",
                loading && "animate-pulse text-slate-400"
              )}
            >
              {periodTotal}
            </span>
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-100">
              new in period
            </span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Listings created in selected window (rent + sale)
          </span>
        </div>
        <div className="flex gap-5 px-1">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative flex h-3 w-3 items-center justify-center rounded-[4px] bg-blue-500 shadow-sm shadow-blue-200 transition-transform group-hover:scale-110">
              <div className="absolute inset-0 rounded-[4px] bg-white opacity-0 mix-blend-overlay transition-opacity group-hover:opacity-20" />
            </div>
            <span className="text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-900">Rentals</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative flex h-3 w-3 items-center justify-center rounded-[4px] bg-emerald-500 shadow-sm shadow-emerald-200 transition-transform group-hover:scale-110">
              <div className="absolute inset-0 rounded-[4px] bg-white opacity-0 mix-blend-overlay transition-opacity group-hover:opacity-20" />
            </div>
            <span className="text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-900">Sales</span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative flex flex-1 min-h-[220px] flex-col mt-2">
        <div className="flex flex-1 gap-4 pr-1">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between pb-8 pt-0 text-[11px] font-semibold text-slate-400 tabular-nums items-end">
            {yLabels.map((l) => (
              <span key={l} className="translate-y-1/2">{l}</span>
            ))}
          </div>
          {/* Chart + grid */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-full border-t border-slate-100"
                  style={{ marginTop: i === 0 ? 0 : undefined }}
                />
              ))}
            </div>
            
            {/* Average (rent + sale) / 2 per bucket */}
            <div
              className="absolute left-0 right-0 z-0 flex items-center group"
              style={{ bottom: `calc(${Math.min(100, (avgVal / scaleMax) * 100)}% + 32px)` }}
            >
              <div className="w-full border-t border-dashed border-blue-300/70" />
              <div className="absolute right-0 translate-x-3 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 shadow-sm border border-blue-100">
                AVG {avgVal.toFixed(1)}
              </div>
            </div>

            {/* Bars container */}
            <div className="relative z-10 flex flex-1 items-end justify-between gap-2 pb-8 sm:gap-4 md:gap-6 pt-2">
              {data.map((d, i) => {
                const isHovered = hoveredIndex === i;
                const isNotHovered = hoveredIndex !== null && !isHovered;
                
                return (
                  <div
                    key={`${range}-${d.label}`}
                    className="group relative flex min-w-0 flex-1 flex-col items-center justify-end h-full gap-2 cursor-pointer pt-6"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(i)}
                    onBlur={() => setHoveredIndex(null)}
                    tabIndex={0}
                  >
                    {/* Hover highlight column */}
                    <div className={cn(
                      "absolute inset-0 -top-4 rounded-xl transition-all duration-300 ease-out z-0",
                      isHovered ? "bg-slate-50/80 ring-1 ring-slate-100" : "bg-transparent"
                    )} />

                    {/* Bars */}
                    <div className="relative z-10 flex h-full w-full max-w-[48px] items-end justify-center gap-1.5 sm:gap-2">
                      <div
                        className={cn(
                          "w-full rounded-t-md bg-blue-500 shadow-sm transition-all duration-500 ease-out relative group/bar overflow-hidden",
                          isNotHovered && "opacity-40 grayscale-[30%]",
                          isHovered && "shadow-blue-300/50 shadow-lg -translate-y-1 brightness-110",
                          !animating ? "" : "!h-0"
                        )}
                        style={{ height: animating ? '0%' : `${Math.max(4, (d.rent / scaleMax) * 100)}%` }}
                      >
                         <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-0 mix-blend-overlay transition-opacity group-hover/bar:opacity-100" />
                      </div>
                      <div
                        className={cn(
                          "w-full rounded-t-md bg-emerald-500 shadow-sm transition-all duration-500 ease-out relative group/bar overflow-hidden delay-[50ms]",
                          isNotHovered && "opacity-40 grayscale-[30%]",
                          isHovered && "shadow-emerald-300/50 shadow-lg -translate-y-1 brightness-110",
                          !animating ? "" : "!h-0"
                        )}
                        style={{ height: animating ? '0%' : `${Math.max(4, (d.sale / scaleMax) * 100)}%` }}
                      >
                         <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-0 mix-blend-overlay transition-opacity group-hover/bar:opacity-100" />
                      </div>
                    </div>

                    {/* X-axis Label */}
                    <span
                      className={cn(
                        "relative z-10 w-full truncate text-center text-[11px] font-semibold transition-all duration-300",
                        isHovered ? "text-blue-700 scale-110" : "text-slate-400 scale-100"
                      )}
                    >
                      {d.label}
                    </span>

                    {/* Fancy Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="relative rounded-xl border border-white/40 bg-white/95 px-4 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl min-w-[140px] before:absolute before:-bottom-2 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-white/95">
                          <p className="mb-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {range === "monthly" ? `July ${d.label}` : d.label}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-blue-500 shadow-sm" />
                                <span className="text-xs font-medium text-slate-500">Rentals</span>
                              </div>
                              <span className="text-xs font-bold text-blue-700">{d.rent}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500 shadow-sm" />
                                <span className="text-xs font-medium text-slate-500">Sales</span>
                              </div>
                              <span className="text-xs font-bold text-emerald-700">{d.sale}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
