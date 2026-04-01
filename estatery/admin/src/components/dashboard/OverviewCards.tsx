"use client";

/**
 * OverviewCards – Three summary cards on the dashboard.
 * Shows Total Revenue, Total Properties Sale, Total Properties Rent with trend percentages.
 * Premium, modern styling with gradients and micro-animations.
 */
import * as React from "react";
import { CircleDollarSign, Building2, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

/** Static card config: title, value, trend (e.g. +12%), icon, colors */
const cards = [
  {
    title: "Total Revenue",
    value: "₵23,569.00",
    trend: "+12.0%",
    trendUp: true,
    label: "vs last month",
    icon: CircleDollarSign,
    iconBg: "bg-gradient-to-tr from-indigo-500 to-indigo-400 shadow-md shadow-indigo-200",
    iconColor: "text-white",
  },
  {
    title: "Total Properties Sale",
    value: "904",
    trend: "-8.5%",
    trendUp: false,
    label: "vs last month",
    icon: Building2,
    iconBg: "bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-md shadow-emerald-200",
    iconColor: "text-white",
  },
  {
    title: "Total Properties Rent",
    value: "573",
    trend: "+5.7%",
    trendUp: true,
    label: "vs last month",
    icon: HandCoins,
    iconBg: "bg-gradient-to-tr from-violet-500 to-fuchsia-400 shadow-md shadow-violet-200",
    iconColor: "text-white",
  },
];

export function OverviewCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Render each card with icon, value, and trend badge */}
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:scale-[0.98]"
        >
          {/* Shine sweep effect on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full z-10 pointer-events-none" />
          
          <div className="relative z-0 flex items-start justify-between gap-4">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 transition-colors duration-300 group-hover:text-slate-700 uppercase">{card.title}</h3>
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3",
                card.iconBg,
                card.iconColor
              )}
            >
              <card.icon className="size-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
            </div>
          </div>
          
          <p className="relative z-0 mt-3 text-2xl font-extrabold tracking-tight text-slate-900 transition-transform duration-300 group-hover:scale-[1.02] origin-left">{card.value}</p>
          
          <div className="relative z-0 mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide border transition-all duration-300 group-hover:scale-105 shadow-sm",
                card.trendUp
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-emerald-100/50"
                  : "bg-rose-50 text-rose-700 border-rose-200/60 shadow-rose-100/50"
              )}
            >
              {card.trend}
            </span>
            <span className="text-xs font-medium text-slate-400">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
