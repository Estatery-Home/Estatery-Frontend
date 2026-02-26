"use client";

/**
 * My Properties – scrollable list from PropertiesContext.
 * Links to property detail; refresh button (demo).
 */
import * as React from "react";
import {
  getPropertyLocation,
  getPropertyImage,
  getPropertyPriceDisplay,
  getRentalPeriodLabel,
} from "@/lib/properties";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperties } from "@/contexts/PropertiesContext";

export function MyProperties() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { properties } = useProperties();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
        <h3 className="text-lg font-semibold text-[#1e293b]">My Properties</h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex size-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e293b] disabled:opacity-50"
          aria-label="Refresh properties"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>
      </div>
      {/* Exactly 4 visible; scroll top-to-down in this same div to see the rest */}
      <div className="h-[32rem] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden space-y-3 px-5 py-4 overscroll-behavior-y-contain">
        {properties.map((prop) => (
          <Link
            key={prop.id}
            to={`/dashboard/properties/${prop.id}`}
            className="group relative flex overflow-hidden gap-3 rounded-lg border border-[#e2e8f0] bg-white p-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.01]"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9]">
              <img
                src={getPropertyImage(prop)}
                alt=""
                className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <p className="truncate font-medium text-[#1e293b] group-hover:text-[var(--logo)]">
                {prop.title}
              </p>
              <p className="truncate text-sm text-[#64748b]">{getPropertyLocation(prop)}</p>
              <p className="mt-0.5 text-sm font-medium text-[#1e293b]">
                {getPropertyPriceDisplay(prop)}
              </p>
              <p className="text-xs text-[#64748b]">{getRentalPeriodLabel(prop)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
