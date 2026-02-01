"use client";

import * as React from "react";
import { RefreshCw, ChevronDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Range = "weekly" | "monthly" | "yearly";

const WEEKLY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const YEARLY_LABELS = ["Q1", "Q2", "Q3", "Q4"];

const weeklyData = WEEKLY_LABELS.map((label, i) => ({
  label,
  rent: [72, 89, 95, 109, 98, 85, 90][i] ?? 90,
  sale: [28, 35, 42, 45, 38, 32, 40][i] ?? 38,
}));

const monthlyData = [
  { label: "1 - 5", rent: 420, sale: 400 },
  { label: "6 - 10", rent: 380, sale: 600 },
  { label: "11 - 15", rent: 109, sale: 45 },
  { label: "16 - 20", rent: 520, sale: 220 },
  { label: "21 - 25", rent: 480, sale: 190 },
  { label: "26 - 30", rent: 550, sale: 210 },
];

const yearlyData = YEARLY_LABELS.map((label, i) => ({
  label,
  rent: [320, 380, 410, 390][i] ?? 375,
  sale: [120, 145, 160, 150][i] ?? 144,
}));

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

const Y_LABELS = ["$0", "$200", "$400", "$600", "$800", "$1K"];
const Y_SCALE_MAX = 1000; // Fixed scale so bar heights match Y-axis figures; $600 = 60%
const AVG_AT = 600; // Avg line at $600 on Y-axis = 60% from bottom

export function ListingsChart() {
  const [range, setRange] = React.useState<Range>("monthly");
  const [animating, setAnimating] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const data = getData(range);
  // Fixed Y scale 0–$1K so bar heights match axis figures; taller chart area = taller bars
  const scaleMax = Y_SCALE_MAX;

  const handleRefresh = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:min-h-[360px] sm:p-5">
      {/* Header: title left, dropdown + refresh right */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#1e293b]">Total Listings</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="appearance-none rounded-lg border border-[#e2e8f0] bg-white py-2 pl-3 pr-8 text-sm text-[#1e293b] transition-colors hover:bg-[#f8fafc] focus:border-[#21438D] focus:outline-none focus:ring-2 focus:ring-[#21438D]/20"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" aria-hidden />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            aria-label="Refresh chart"
          >
            <RefreshCw className={cn("size-4", animating && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Summary: 834 ↑ 10,5% Last updated + legend */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="text-xl font-bold text-[#1e293b]">834</span>
          <span className="flex items-center gap-0.5 font-medium text-[#21438D]">
            <TrendingUp className="size-4" />
            10,5%
          </span>
          <span className="text-[#64748b]">Last updated: July 08, 2025</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#1e40af]" />
            <span className="text-sm text-[#64748b]">Property Rent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-sm bg-[#84cc16]" />
            <span className="text-sm text-[#64748b]">Property Sale</span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative flex flex-1 min-h-[240px] flex-col sm:min-h-[280px]">
        <div className="flex flex-1 gap-2 pr-2">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between pb-6 pt-0 text-xs text-[#64748b]">
            {Y_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          {/* Chart + grid */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Dashed grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-full border-t border-dashed border-[#e2e8f0]"
                  style={{ marginTop: i === 0 ? 0 : undefined }}
                />
              ))}
            </div>
            {/* Avg line at $600 on Y-axis (60% from bottom) */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-[#1e293b]"
              style={{
                bottom: `calc(${(AVG_AT / scaleMax) * 100}% + 24px)`,
              }}
            />
            <div
              className="absolute rounded bg-[#1e293b] px-1.5 py-0.5 text-xs font-medium text-white"
              style={{
                left: 0,
                bottom: `calc(${(AVG_AT / scaleMax) * 100}% + 12px)`,
              }}
            >
              Avg
            </div>
            {/* Bars - scaled to data max so tallest bar fills height */}
            <div className="relative z-10 flex flex-1 items-end justify-between gap-1 pb-6 sm:gap-2">
              {data.map((d, i) => (
                <div
                  key={`${range}-${d.label}`}
                  className="relative flex min-w-0 flex-1 flex-col items-center gap-1 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(i)}
                  onBlur={() => setHoveredIndex(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: Rent ${d.rent}, Sale ${d.sale}`}
                >
                  <div
                    className={cn(
                      "flex h-full w-full max-w-[64px] gap-0.5 sm:gap-1 items-end justify-center rounded-t transition-all duration-300",
                      hoveredIndex === i && "ring-2 ring-[#21438D]/40 ring-offset-2 ring-offset-white"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t bg-[#1e40af] transition-all duration-300 ease-out min-h-[6px]",
                        hoveredIndex === i ? "opacity-100 brightness-110" : "hover:brightness-105"
                      )}
                      style={{
                        height: `${Math.max(6, (d.rent / scaleMax) * 100)}%`,
                      }}
                    />
                    <div
                      className={cn(
                        "w-full rounded-t bg-[#84cc16] transition-all duration-300 ease-out min-h-[6px]",
                        hoveredIndex === i ? "opacity-100 brightness-110" : "hover:brightness-105"
                      )}
                      style={{
                        height: `${Math.max(6, (d.sale / scaleMax) * 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-full truncate text-center text-xs transition-colors",
                      hoveredIndex === i ? "font-semibold text-[#1e293b]" : "text-[#64748b]",
                      i === 2 && range === "monthly" && "font-semibold text-[#1e293b]"
                    )}
                  >
                    {d.label}
                  </span>
                  {/* Tooltip - interactive, stays in view */}
                  {hoveredIndex === i && (
                    <div
                      className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-xl transition-opacity duration-150"
                      role="tooltip"
                    >
                      <p className="text-xs font-semibold text-[#1e293b]">
                        {range === "monthly"
                          ? `July ${d.label.split(" - ")[0] ?? ""}, 2025`
                          : range === "weekly"
                            ? d.label
                            : `${d.label} 2025`}
                      </p>
                      <p className="mt-1 text-xs text-[#64748b]">
                        Property Rent <span className="font-medium text-[#1e40af]">{d.rent}</span>
                      </p>
                      <p className="text-xs text-[#64748b]">
                        Property Sale <span className="font-medium text-[#84cc16]">{d.sale}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
