"use client";

/**
 * Analytics — host KPIs, booking-activity trend, listing mix, top properties.
 * Data: GET /api/host/analytics/?range=7d|30d|90d
 */
import * as React from "react";
import { LineChart, PieChart, TrendingUp, Users, Home, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { fetchHostAnalytics } from "@/lib/api-client";
import type { HostAnalyticsResponse } from "@/lib/api-types";

type Range = "7d" | "30d" | "90d";

export default function Analytics() {
  const [range, setRange] = React.useState<Range>("30d");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<HostAnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchHostAnalytics(range).then((res) => {
      if (!cancelled) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  React.useEffect(() => {
    setPage(1);
  }, [range, data?.top_properties?.length]);

  const summary = data?.summary;
  const traffic = data?.traffic;
  const mix = data?.listing_mix;
  const top = data?.top_properties ?? [];

  const totalProperties = summary?.properties_total ?? 0;
  const totalClients = summary?.clients ?? 0;
  const activeDiscounts = summary?.active_discounts ?? 0;
  const occupancyRate = summary?.occupancy_rate ?? 0;

  const viewsSeries = traffic?.series?.length ? traffic.series : [0];
  const maxViews = Math.max(...viewsSeries, 1);

  const pr = mix?.percent?.rent ?? 0;
  const ps = mix?.percent?.sale ?? 0;
  const pv = mix?.percent?.reserved ?? 0;
  const mixGradient = `conic-gradient(var(--logo) 0deg ${(pr / 100) * 360}deg, #22c55e ${(pr / 100) * 360}deg ${((pr + ps) / 100) * 360}deg, #f97316 ${((pr + ps) / 100) * 360}deg 360deg)`;

  const PAGE_SIZE = 8;
  const pageCount = Math.max(1, Math.ceil(top.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = top.slice(startIdx, startIdx + PAGE_SIZE);

  const handleExportTraffic = () => {
    if (!traffic?.labels?.length) return;
    const header = ["date", "bookings_created"];
    const rows = traffic.labels.map((label, i) => [label, String(traffic.series[i] ?? 0)]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-traffic-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Analytics</h1>
            <p className="mt-1 text-xs text-[#64748b]">
              Performance from your listings, bookings, and promos.
              {loading && <span className="ml-1 text-[#94a3b8]">Loading…</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-medium text-[#64748b]">
            <span className="px-2 text-[#94a3b8]">Date range</span>
            {(["7d", "30d", "90d"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={cn(
                  "rounded-full px-3 py-1",
                  range === k && "bg-[var(--logo-muted)] text-[#0f172a]"
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Home className="size-4" />
            </div>
            <div className="relative min-w-0">
              <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">
                Your properties
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">
                {totalProperties}
              </p>
              <p className="text-[10px] text-[#94a3b8]">{summary?.properties_available ?? 0} available</p>
            </div>
          </div>
          <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Users className="size-4" />
            </div>
            <div className="relative min-w-0">
              <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Clients</p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">
                {totalClients}
              </p>
              <p className="text-[10px] text-[#94a3b8]">Tenants with bookings</p>
            </div>
          </div>
          <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Activity className="size-4" />
            </div>
            <div className="relative min-w-0">
              <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">
                Occupancy rate
              </p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">
                {occupancyRate}%
              </p>
              <p className="text-[10px] text-[#94a3b8]">Rented / total units</p>
            </div>
          </div>
          <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp className="size-4" />
            </div>
            <div className="relative min-w-0">
              <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Active discounts</p>
              <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">
                {activeDiscounts}
              </p>
              <p className="text-[10px] text-[#94a3b8]">Promos you can use</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <section className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.005]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
            <div className="relative mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)]">
                  <LineChart className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">Booking activity</p>
                  <p className="text-xs text-[#94a3b8]">
                    New bookings on your properties by day (no separate view counts yet).
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                onClick={handleExportTraffic}
                disabled={!traffic?.labels?.length}
              >
                Export
              </Button>
            </div>
            <div className="relative mt-2 h-48 w-full overflow-hidden rounded-lg bg-[#f8fafc]">
              <svg
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
                className="h-full w-full text-[var(--logo)]"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={viewsSeries
                    .map((v, i) => {
                      const x = (i / Math.max(viewsSeries.length - 1, 1)) * 200;
                      const y = 100 - (v / maxViews) * 80 - 10;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              </svg>
            </div>
          </section>

          <section className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.005]">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
            <div className="relative mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d]">
                <PieChart className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Listing mix</p>
                <p className="text-xs text-[#94a3b8]">Available rent vs sale vs occupied / other.</p>
              </div>
            </div>
            <div className="relative flex items-center gap-4">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                <div
                  className="size-28 rounded-full"
                  style={{ background: mixGradient }}
                />
                <div className="absolute size-[4.5rem] rounded-full bg-white" />
                <div className="absolute text-center">
                  <p className="text-xs text-[#94a3b8]">Total</p>
                  <p className="text-lg font-semibold text-[#0f172a]">{mix?.total ?? 0}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[var(--logo)]" />
                  <span className="text-[#0f172a]">Rent (available)</span>
                  <span className="ml-auto text-[#94a3b8]">{pr}% · {mix?.rent ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[#22c55e]" />
                  <span className="text-[#0f172a]">Sale (available)</span>
                  <span className="ml-auto text-[#94a3b8]">{ps}% · {mix?.sale ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[#f97316]" />
                  <span className="text-[#0f172a]">Occupied / other</span>
                  <span className="ml-auto text-[#94a3b8]">{pv}% · {mix?.reserved ?? 0}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#cbd5e1] hover:shadow-lg active:scale-[1.005]">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-out group-hover:translate-x-full" />
          <div className="relative mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)]">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Top properties</p>
                <p className="text-xs text-[#94a3b8]">By new bookings in the selected range.</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-x-auto">
            <table className="min-w-[640px] w-full table-auto text-sm">
              <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                <tr>
                  <th className="px-4 py-2 text-left">Property</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Bookings ({range})</th>
                  <th className="px-4 py-2 text-left">Leads (same)</th>
                  <th className="px-4 py-2 text-left">Last updated</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr key={p.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                    <td className="px-4 py-2 align-middle text-sm text-[#0f172a]">{p.title}</td>
                    <td className="px-4 py-2 align-middle text-xs text-[#64748b]">{p.location || "—"}</td>
                    <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">
                      {p.bookings_in_period}
                    </td>
                    <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">{p.leads}</td>
                    <td className="px-4 py-2 align-middle text-xs text-[#94a3b8]">
                      {p.updated_at
                        ? new Date(p.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {top.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-sm text-[#94a3b8]">No properties or bookings in this range yet.</p>
          )}
          <Pagination
            totalItems={top.length}
            pageSize={PAGE_SIZE}
            currentPage={safePage}
            onPageChange={setPage}
            itemLabel="properties"
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
