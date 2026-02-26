"use client";

/**
 * Property status donut – Available / Rented / Sold.
 * Uses PropertiesContext; refresh changes seed.
 */
import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useProperties } from "@/contexts/PropertiesContext";

function getDonutData(properties: { status?: string }[], seed: number) {
  const rnd = (base: number, variance: number) =>
    Math.max(0, Math.floor(base + Math.sin(seed * 0.5) * variance));
  const baseAvailable = properties.filter((p) => p.status === "available").length || 47;
  const baseRent = properties.filter((p) => p.status === "rented").length || 23;
  const baseSold = properties.filter((p) => p.status === "maintenance").length || 12;
  return {
    available: Math.max(1, rnd(baseAvailable, 8)),
    rent: Math.max(1, rnd(baseRent, 5)),
    maintenance: Math.max(1, rnd(baseSold, 4)),
  };
}

export function PropertyListedDonut() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { properties } = useProperties();

  const { available, rent, maintenance } = React.useMemo(
    () => getDonutData(properties, refreshKey),
    [properties, refreshKey]
  );
  const total = available + rent + maintenance;
  const pct = Math.round((maintenance / total) * 100);

  const r = 40;
  const circumference = 2 * Math.PI * r;

  const availLen = (available / total) * circumference;
  const rentLen = (rent / total) * circumference;
  const maintLen = (maintenance / total) * circumference;

  return (
    <div className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#e2e8f0] pb-4">
        <h3 className="text-lg font-bold text-[#0f172a]">Property Listed</h3>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex size-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] transition-colors hover:bg-[#e2e8f0] hover:text-[#475569]"
          aria-label="Refresh"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Full circular donut chart */}
      <div className="flex flex-col items-center py-2">
        <div className="relative size-40 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--logo)"
              strokeWidth="16"
              strokeDasharray={`${availLen} ${circumference}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#22c55e"
              strokeWidth="16"
              strokeDasharray={`${rentLen} ${circumference}`}
              strokeDashoffset={-availLen}
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#f97316"
              strokeWidth="16"
              strokeDasharray={`${maintLen} ${circumference}`}
              strokeDashoffset={-(availLen + rentLen)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
            <span className="text-2xl font-bold leading-none text-[#0f172a]">{pct}%</span>
          </div>
        </div>
        <p className="mt-1 text-center text-xs text-[#94a3b8]">
          in maintenance
        </p>
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-[var(--logo)]" />
            <span className="text-sm font-medium text-[#0f172a]">Available Properties</span>
          </div>
          <span className="text-sm text-[#64748b]">{available}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-[#22c55e]" />
            <span className="text-sm font-medium text-[#0f172a]">Rent Properties</span>
          </div>
          <span className="text-sm text-[#64748b]">{rent}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-[#f97316]" />
            <span className="text-sm font-medium text-[#0f172a]">Maintenance</span>
          </div>
          <span className="text-sm text-[#64748b]">{maintenance}</span>
        </div>
      </div>
    </div>
  );
}
