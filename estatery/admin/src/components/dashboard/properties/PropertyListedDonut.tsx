"use client";

/**
 * Property status donut – Available / Rented / Sold.
 * Uses PropertiesContext; refresh changes seed.
 */
import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useProperties } from "@/contexts/PropertiesContext";
import { PROPERTY_STATUS_HEX } from "@/lib/properties";

export function PropertyListedDonut() {
  const { properties, refetchProperties } = useProperties();

  const { available, rent, maintenance } = React.useMemo(() => {
    const available = properties.filter((p) => p.status === "available").length;
    const rent = properties.filter((p) => p.status === "rented").length;
    const maintenance = properties.filter((p) => p.status === "maintenance").length;
    return { available, rent, maintenance };
  }, [properties]);
  const total = available + rent + maintenance;

  const r = 40;
  const circumference = 2 * Math.PI * r;

  const safeTotal = Math.max(1, total);
  const availLen = (available / safeTotal) * circumference;
  const rentLen = (rent / safeTotal) * circumference;
  const maintLen = (maintenance / safeTotal) * circumference;

  return (
    <div className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-[#e2e8f0] pb-4">
        <h3 className="text-lg font-bold text-[#0f172a]">Property Listed</h3>
        <button
          type="button"
          onClick={() => void refetchProperties()}
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
              stroke={PROPERTY_STATUS_HEX.available}
              strokeWidth="16"
              strokeDasharray={`${availLen} ${circumference}`}
              strokeDashoffset="0"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={PROPERTY_STATUS_HEX.rented}
              strokeWidth="16"
              strokeDasharray={`${rentLen} ${circumference}`}
              strokeDashoffset={-availLen}
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={PROPERTY_STATUS_HEX.maintenance}
              strokeWidth="16"
              strokeDasharray={`${maintLen} ${circumference}`}
              strokeDashoffset={-(availLen + rentLen)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
            <span className="text-2xl font-bold leading-none text-[#0f172a]">{total}</span>
          </div>
        </div>
        <p className="mt-1 text-center text-xs text-[#94a3b8]">
          total properties
        </p>
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: PROPERTY_STATUS_HEX.available }}
            />
            <span className="text-sm font-medium text-[#0f172a]">Available Properties</span>
          </div>
          <span className="text-sm text-[#64748b]">{available}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: PROPERTY_STATUS_HEX.rented }}
            />
            <span className="text-sm font-medium text-[#0f172a]">Rented</span>
          </div>
          <span className="text-sm text-[#64748b]">{rent}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: PROPERTY_STATUS_HEX.maintenance }}
            />
            <span className="text-sm font-medium text-[#0f172a]">Maintenance</span>
          </div>
          <span className="text-sm text-[#64748b]">{maintenance}</span>
        </div>
      </div>
    </div>
  );
}
