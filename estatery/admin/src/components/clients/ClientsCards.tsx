"use client";

/**
 * Clients overview cards — totals from GET /api/host/clients/ summary.
 */
import * as React from "react";
import { PieChart, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientsCardsProps = {
  total: number;
  ongoing: number;
  completed: number;
  loading?: boolean;
};

export function ClientsCards({ total, ongoing, completed, loading }: ClientsCardsProps) {
  const cards = React.useMemo(
    () => [
      {
        title: "Total Clients",
        value: String(total),
        label: "Distinct customers with bookings on your listings",
        icon: PieChart,
        gradient: "from-blue-500 to-indigo-600",
        shadow: "shadow-indigo-500/20",
      },
      {
        title: "Active relationships",
        value: String(ongoing),
        label: "On track or overdue payments / open bookings",
        icon: Clock,
        gradient: "from-indigo-500 to-violet-600",
        shadow: "shadow-violet-500/20",
      },
      {
        title: "Completed",
        value: String(completed),
        label: "No open bookings with you",
        icon: CheckCircle,
        gradient: "from-emerald-400 to-teal-500",
        shadow: "shadow-emerald-500/20",
      },
    ],
    [total, ongoing, completed]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm border border-slate-100"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full z-10" />

          <div className="relative flex items-start justify-between">
            <div className="space-y-1 z-10">
              <p className="text-[13px] font-semibold text-slate-500">{card.title}</p>
              <p
                className={cn(
                  "text-2xl font-black tracking-tight text-slate-900 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-1",
                  loading && "animate-pulse text-slate-400"
                )}
              >
                {card.value}
              </p>
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

          <p className="relative mt-4 text-xs font-medium text-slate-400 z-10">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
