"use client";

/**
 * Clients overview cards – total, ongoing, completed.
 * Premium modernized dashboard styling.
 */
import * as React from "react";
import { PieChart, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    title: "Total Clients",
    value: "249",
    trend: "+12.5%",
    trendUp: true,
    label: "from last month",
    icon: PieChart,
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-indigo-500/20",
    trendColor: "text-emerald-500",
    trendBg: "bg-emerald-50/80",
  },
  {
    title: "On Going Client",
    value: "56",
    trend: "-2.4%",
    trendUp: false,
    label: "from last month",
    icon: Clock,
    gradient: "from-indigo-500 to-violet-600",
    shadow: "shadow-violet-500/20",
    trendColor: "text-rose-500",
    trendBg: "bg-rose-50/80",
  },
  {
    title: "Completed Client",
    value: "127",
    trend: "+8.5%",
    trendUp: true,
    label: "from last month",
    icon: CheckCircle,
    gradient: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/20",
    trendColor: "text-emerald-500",
    trendBg: "bg-emerald-50/80",
  },
];

export function ClientsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm border border-slate-100"
        >
          {/* Subtle Shine Sweep Effect on Hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full z-10" />
          
          <div className="relative flex items-start justify-between">
            <div className="space-y-1 z-10">
              <p className="text-[13px] font-semibold text-slate-500">{card.title}</p>
              <p className="text-2xl font-black tracking-tight text-slate-900 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-1">{card.value}</p>
            </div>
            
            <div
              className={cn(
                "relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 z-10",
                card.gradient,
                card.shadow
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <card.icon className="size-[22px]" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="relative mt-4 flex items-center gap-2 z-10">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide transition-all group-hover:scale-105",
                card.trendBg,
                card.trendColor
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
