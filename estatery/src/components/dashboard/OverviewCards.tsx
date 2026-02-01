"use client";

import * as React from "react";
import { CircleDollarSign, Building2, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    title: "Total Revenue",
    value: "$23,569.00",
    trend: "+12%",
    trendUp: true,
    label: "from last month",
    icon: CircleDollarSign,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[#1d4ed8]",
  },
  {
    title: "Total Properties Sale",
    value: "904",
    trend: "-8,5%",
    trendUp: false,
    label: "from last month",
    icon: Building2,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[#1d4ed8]",
  },
  {
    title: "Total Properties Rent",
    value: "573",
    trend: "+5,7%",
    trendUp: true,
    label: "from last month",
    icon: HandCoins,
    iconBg: "bg-[#e5e7eb]",
    iconColor: "text-[#1d4ed8]",
  },
];

export function OverviewCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#cbd5e1]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-[#64748b]">{card.title}</p>
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                card.iconBg,
                card.iconColor
              )}
            >
              <card.icon className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-[#1e293b]">{card.value}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
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
            <span className="text-[#64748b]">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
