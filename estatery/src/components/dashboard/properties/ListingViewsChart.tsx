"use client";

import * as React from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

type RangeType = "Daily" | "Weekly" | "Monthly" | "Yearly";

type ChartPoint = {
  date: Date;
  dateLabel: string;
  views: number;
  property: number;
};

function generateChartData(range: RangeType, seed: number): ChartPoint[] {
  const rnd = (base: number, variance: number) =>
    Math.floor(base + Math.sin(seed * 0.1 + base) * variance);

  const baseDate = new Date(2025, 5, 15); // June 15, 2025

  if (range === "Daily") {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(baseDate, i);
      return {
        date: d,
        dateLabel: format(d, "MMMM d, yyyy"),
        views: rnd(600 + i * 40, 120),
        property: rnd(250 + i * 15, 60),
      };
    });
  }

  if (range === "Weekly") {
    return Array.from({ length: 4 }, (_, i) => {
      const d = addDays(baseDate, i * 7);
      return {
        date: d,
        dateLabel: format(d, "MMMM d, yyyy"),
        views: rnd(650 + i * 80, 150),
        property: rnd(280 + i * 35, 70),
      };
    });
  }

  if (range === "Monthly") {
    return Array.from({ length: 6 }, (_, i) => {
      const d = addDays(baseDate, i * 6);
      return {
        date: d,
        dateLabel: format(d, "MMMM d, yyyy"),
        views: rnd(600 + i * 80, 130),
        property: rnd(250 + i * 35, 65),
      };
    });
  }

  // Yearly - 12 months
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2025, i, 15);
    return {
      date: d,
      dateLabel: format(d, "MMMM d, yyyy"),
      views: rnd(500 + i * 60, 180),
      property: rnd(200 + i * 30, 80),
    };
  });
}

const PADDING = { top: 20, right: 16, bottom: 36, left: 40 };
const Y_TICKS = [0, 200, 400, 600, 800, 1000];

export function ListingViewsChart() {
  const [range, setRange] = React.useState<RangeType>("Monthly");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const data = React.useMemo(
    () => generateChartData(range, refreshKey),
    [range, refreshKey]
  );

  const chartWidth = 400;
  const chartHeight = 180;

  const xScale = (i: number) =>
    PADDING.left +
    (i / Math.max(1, data.length - 1)) * (chartWidth - PADDING.left - PADDING.right);
  const yScale = (v: number) => {
    const maxVal = Math.max(1000, ...data.flatMap((d) => [d.views, d.property]));
    return (
      chartHeight -
      PADDING.bottom -
      (v / maxVal) * (chartHeight - PADDING.top - PADDING.bottom)
    );
  };

  const viewsPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.views)}`)
    .join(" ");
  const viewsAreaPath =
    `${viewsPath} L ${xScale(data.length - 1)} ${chartHeight - PADDING.bottom} L ${xScale(0)} ${chartHeight - PADDING.bottom} Z`;

  const propertyPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.property)}`)
    .join(" ");
  const propertyAreaPath =
    `${propertyPath} L ${xScale(data.length - 1)} ${chartHeight - PADDING.bottom} L ${xScale(0)} ${chartHeight - PADDING.bottom} Z`;

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const xSvg = (xPx / rect.width) * chartWidth;
    const graphLeft = PADDING.left;
    const graphWidth = chartWidth - PADDING.left - PADDING.right;
    const relativeX = xSvg - graphLeft;
    if (relativeX < 0 || relativeX > graphWidth) {
      setHoverIndex(null);
      return;
    }
    const idx = (relativeX / graphWidth) * (data.length - 1);
    const clamped = Math.max(0, Math.min(data.length - 1, Math.round(idx)));
    setHoverIndex(clamped);
  };

  const handleMouseLeave = () => setHoverIndex(null);

  const hoveredPoint = hoverIndex != null ? data[hoverIndex] : null;

  return (
    <div className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">Listing Views</h3>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#f97316]" />
              Views Count
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#22c55e]" />
              Property Count
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex min-w-[100px] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] transition-colors hover:border-[#cbd5e1] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            >
              {range}
              <ChevronDown className="size-4 shrink-0 text-[#64748b]" />
            </button>
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-full min-w-[100px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
                  {(["Daily", "Weekly", "Monthly", "Yearly"] as RangeType[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setRange(opt);
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm",
                        range === opt ? "bg-[var(--logo-muted)] font-medium text-[var(--logo)]" : "text-[#1e293b] hover:bg-[#f8fafc]"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[var(--logo)]"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-h-[200px] w-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="propertyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Vertical dashed gridlines */}
          {data.map((_, i) => (
            <line
              key={i}
              x1={xScale(i)}
              y1={PADDING.top}
              x2={xScale(i)}
              y2={chartHeight - PADDING.bottom}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}

          {/* Hover vertical highlight */}
          {hoverIndex != null && (
            <rect
              x={xScale(hoverIndex) - 20}
              y={PADDING.top}
              width={40}
              height={chartHeight - PADDING.top - PADDING.bottom}
              fill="#f97316"
              fillOpacity={0.08}
            />
          )}

          {/* Area fills (under lines) */}
          <path d={viewsAreaPath} fill="url(#viewsGrad)" />
          <path d={propertyAreaPath} fill="url(#propertyGrad)" />

          {/* Lines */}
          <path
            d={viewsPath}
            fill="none"
            stroke="#f97316"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={propertyPath}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover dots */}
          {hoveredPoint && hoverIndex != null && (
            <>
              <circle
                cx={xScale(hoverIndex)}
                cy={yScale(hoveredPoint.views)}
                r={5}
                fill="#f97316"
                stroke="white"
                strokeWidth={2}
              />
              <circle
                cx={xScale(hoverIndex)}
                cy={yScale(hoveredPoint.property)}
                r={5}
                fill="#22c55e"
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}

          {/* Y-axis labels */}
          {Y_TICKS.map((tick) => (
            <text
              key={tick}
              x={PADDING.left - 8}
              y={yScale(tick) + 4}
              textAnchor="end"
              fill="#94a3b8"
              style={{ fontSize: 10, fontWeight: 500 }}
            >
              {tick === 1000 ? "1K" : tick}
            </text>
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const step =
              range === "Yearly" ? 2 : range === "Daily" ? 2 : range === "Monthly" ? 1 : 1;
            if (i % step !== 0 && i !== data.length - 1) return null;
            const label =
              range === "Yearly"
                ? format(d.date, "MMM")
                : range === "Monthly" && (i === 0 || i === data.length - 1)
                  ? format(d.date, "MMMM d, yyyy")
                  : format(d.date, "MMM d");
            return (
              <text
                key={i}
                x={xScale(i)}
                y={chartHeight - 8}
                textAnchor="middle"
                fill="#94a3b8"
                style={{ fontSize: 10, fontWeight: 500 }}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && hoverIndex != null && (
          <div
            className="pointer-events-none absolute z-10 w-[140px] rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 shadow-lg"
            style={{
              left: `calc(10% + ${(hoverIndex / Math.max(1, data.length - 1)) * 75}% - 70px)`,
              top: 50,
            }}
          >
            <p className="text-xs font-semibold text-[#1e293b]">
              {hoveredPoint.dateLabel}
            </p>
            <div className="mt-1.5 space-y-1">
              <p className="text-xs">
                <span className="text-[#64748b]">Views </span>
                <span className="font-semibold text-[#f97316]">
                  {hoveredPoint.views.toLocaleString()}
                </span>
              </p>
              <p className="text-xs">
                <span className="text-[#64748b]">Property </span>
                <span className="font-semibold text-[#22c55e]">
                  {hoveredPoint.property.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
