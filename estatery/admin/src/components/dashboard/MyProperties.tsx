"use client";

/**
 * My Properties – scrollable list from PropertiesContext.
 * Premium visualization of properties directly on the dashboard.
 */
import * as React from "react";
import {
  getPropertyLocation,
  getPropertyImage,
  getPropertyPriceDisplay,
  getRentalPeriodLabel,
} from "@/lib/properties";
import { Link } from "react-router-dom";
import { RefreshCw, Play, Building2 } from "lucide-react";
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
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">My Properties</h3>
          <p className="text-[13px] text-slate-500 mt-0.5">Your active listings overview</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm hover:border-indigo-100 active:scale-95 disabled:opacity-50"
          aria-label="Refresh properties"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin text-indigo-600")} />
        </button>
      </div>
      
      <div className="space-y-4 overflow-x-hidden px-6 py-5">
        {properties.slice(0, 4).map((prop) => (
          <Link
            key={prop.id}
            to={`/dashboard/properties/${prop.id}`}
            className="group relative flex gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:border-indigo-100/50 hover:shadow-[0_4px_20px_rgb(0,0,0,0.05)] active:scale-[0.98]"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm">
              <img
                src={getPropertyImage(prop)}
                alt=""
                className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-indigo-900/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="relative min-w-0 flex-1 flex flex-col justify-center">
              <p className="truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                {prop.title}
              </p>
              <p className="truncate text-[11px] font-medium text-slate-400 mt-0.5">{getPropertyLocation(prop)}</p>
              
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">
                  {getPropertyPriceDisplay(prop)}
                  {getRentalPeriodLabel(prop) && <span className="text-[11px] font-medium text-slate-400 font-normal"> / {getRentalPeriodLabel(prop).toLowerCase().replace('/', '')}</span>}
                </p>
                
                <div className="flex size-6 items-center justify-center rounded-full bg-slate-200/50 text-slate-400 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <Play className="size-3 ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>
        ))}
        {properties.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center py-10 text-center">
             <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-50">
                <Building2 className="size-6 text-slate-400" />
             </div>
             <p className="text-sm font-bold text-slate-700">No properties added yet</p>
             <p className="mt-1 text-xs text-slate-500">Click the + button to add one</p>
          </div>
        )}
      </div>
    </div>
  );
}
