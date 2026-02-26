"use client";

/**
 * Clients overview cards – total, ongoing, completed.
 */
import * as React from "react";
import { PieChart, Clock, CheckCircle,  } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    title: "Total Clients",
    value: "249",
    trend: "-8.5%",
    trendUp: true,
    label: "from last month",
    icon: PieChart,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[var(--logo)]",
  },
  {
    title: "On Going Client",
    value: "56",
    trend: "-8,5%",
    trendUp: false,
    label: "from last month",
    icon: Clock,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[var(--logo)]",
  },
  {
    title: "Completed Client",
    value: "127",
    trend: "-8.5%",
    trendUp: true,
    label: "from last month",
    icon: CheckCircle,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[var(--logo)]",
  },
];

export function ClientsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
          <div className="relative flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">{card.title}</p>
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                card.iconBg,
                card.iconColor
              )}
            >
              <card.icon className="size-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>
          <p className="relative mt-2 text-xl font-bold text-[#1e293b] transition-transform duration-300 group-hover:scale-[1.02]">{card.value}</p>
          <div className="relative mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-transform duration-300 group-hover:scale-105",
                card.trendUp
                  ? "bg-[#dcfce7] text-[#16a34a]"
                  : "bg-[#fee2e2] text-[#dc2626]"
              )}
            >
              {card.trend}
            </span>
            <span className="text-[#64748b]">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
