"use client";

/**
 * OverviewCards – Three summary KPIs from GET /api/dashboard/host/.
 */
import * as React from "react";
import { CircleDollarSign, Building2, HandCoins, CalendarCheck2 } from "lucide-react";
import { cn, formatDashboardCurrency, formatTrendPct } from "@/lib/utils";
import type {
  HostDashboardBookings,
  HostDashboardComparison,
  HostDashboardProperties,
  HostDashboardRevenue,
} from "@/lib/api-types";

type OverviewCardsProps = {
  properties: HostDashboardProperties | null;
  bookings: HostDashboardBookings | null;
  revenue: HostDashboardRevenue | null;
  comparison: HostDashboardComparison | null;
  currency: string;
  loading?: boolean;
};

export function OverviewCards({
  properties,
  bookings,
  revenue,
  comparison,
  currency,
  loading,
}: OverviewCardsProps) {
  const cards = React.useMemo(() => {
    const revTrend = formatTrendPct(comparison?.revenue_pct);
    const rentTrend = formatTrendPct(comparison?.rent_listings_pct);
    const saleTrend = formatTrendPct(comparison?.sale_listings_pct);
    return [
      {
        title: "Total Revenue",
        value: revenue
          ? formatDashboardCurrency(currency, revenue.total)
          : "—",
        trend: revTrend,
        label: "vs prior 30 days",
        icon: CircleDollarSign,
        iconWrap: "bg-blue-50 text-blue-600",
      },
      {
        title: "Total Bookings",
        value: bookings != null ? String(bookings.total) : "—",
        trend: null,
        label: "all booking statuses",
        icon: CalendarCheck2,
        iconWrap: "bg-amber-50 text-amber-600",
      },
      {
        title: "Properties for sale",
        value:
          properties != null ? String(properties.sale_listings) : "—",
        trend: saleTrend,
        label: "new listings vs prior 30 days",
        icon: Building2,
        iconWrap: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Properties for rent",
        value:
          properties != null ? String(properties.rent_listings) : "—",
        trend: rentTrend,
        label: "new listings vs prior 30 days",
        icon: HandCoins,
        iconWrap: "bg-violet-50 text-violet-600",
      },
    ];
  }, [properties, bookings, revenue, comparison, currency]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative min-h-[156px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">{card.title}</h3>
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105", card.iconWrap)}>
              <card.icon className="size-4" strokeWidth={2.2} />
            </div>
          </div>

          <p
            className={cn(
              "mt-4 text-3xl font-bold tracking-tight text-slate-900",
              loading && "animate-pulse text-slate-400"
            )}
          >
            {card.value}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {card.trend ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide border",
                  card.trend.up
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                    : "bg-rose-50 text-rose-700 border-rose-200/70"
                )}
              >
                {card.trend.text}
              </span>
            ) : (
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-200">
                No comparison
              </span>
            )}
            <span className="text-xs font-medium text-slate-500">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
