"use client";

import * as React from "react";
import { PersonStanding, Activity, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    title: "Total Leads",
    value: "50",
    trend: "+8.5%",
    trendUp: true,
    label: "from last month",
    icon: PersonStanding,
    iconBg: "bg-[var(--logo-muted)]",
    iconColor: "text-[var(--logo)]",
  },
  {
    title: "Active Pipeline",
    value: "56",
    trend: "+8.5%",
    trendUp: true,
    label: "from last month",
    icon: Activity,
    iconBg: "bg-[var(--logo-muted)]",
    iconColor: "text-[var(--logo)]",
  },
  {
    title: "Conversion Rate",
    value: "20%",
    trend: "+8.5%",
    trendUp: true,
    label: "from last month",
    icon: Percent,
    iconBg: "bg-[var(--logo-muted)]",
    iconColor: "text-[var(--logo)]",
  },
];

export function LeadsSummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white p-6 shadow-lg shadow-slate-200/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#64748b]">{card.title}</p>
              <p className="mt-1.5 text-2xl font-bold text-[#1e293b]">{card.value}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-medium",
                    card.trendUp
                      ? "bg-[#dcfce7] text-[#16a34a]"
                      : "bg-[#fee2e2] text-[#dc2626]"
                  )}
                >
                  {card.trend}
                </span>
                <span className="text-[#94a3b8]">{card.label}</span>
              </div>
            </div>
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                card.iconBg,
                card.iconColor
              )}
            >
              <card.icon className="size-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
