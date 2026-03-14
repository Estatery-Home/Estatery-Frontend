"use client";

/**
 * Analytics – traffic charts, stats (properties, clients, occupancy).
 * Date range (7d/30d/90d); paginated property list.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, PieChart, TrendingUp, Users, Home, Activity } from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { useProperties } from "@/contexts/PropertiesContext";
import { clientsTableData } from "@/lib/clients";
import { getPropertyLocation } from "@/lib/properties";

type Range = "7d" | "30d" | "90d";

const trafficData: Record<Range, number[]> = {
  "7d": [80, 120, 150, 110, 180, 160, 210],
  "30d": [120, 150, 130, 180, 200, 220, 260, 240, 230, 280, 300, 320],
  "90d": [100, 140, 160, 200, 180, 220, 260, 280, 300, 320, 340, 360],
};

export default function Analytics() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { properties } = useProperties();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [range, setRange] = React.useState<Range>("30d");
  const [page, setPage] = React.useState(1);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const totalProperties = properties.length;
  const totalClients = clientsTableData.length;
  const activeDiscounts = 3;
  const occupancyRate = 86;

  const viewsSeries = trafficData[range];
  const maxViews = Math.max(...viewsSeries, 1);
  const PAGE_SIZE = 8;
  const pageCount = Math.max(1, Math.ceil(properties.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageProperties = properties.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-2.75rem)] flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Analytics</h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Monitor performance across listings, leads, and revenue.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-xs font-medium text-[#64748b]">
                <span className="px-2 text-[#94a3b8]">Date range</span>
                <button
                  type="button"
                  onClick={() => setRange("7d")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    range === "7d" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  7d
                </button>
                <button
                  type="button"
                  onClick={() => setRange("30d")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    range === "30d" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  30d
                </button>
                <button
                  type="button"
                  onClick={() => setRange("90d")}
                  className={cn(
                    "rounded-full px-3 py-1",
                    range === "90d" && "bg-[var(--logo-muted)] text-[#0f172a]"
                  )}
                >
                  90d
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Home className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Active Properties</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{totalProperties}</p>
                </div>
              </div>
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Users className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Clients</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{totalClients}</p>
                </div>
              </div>
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Activity className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Occupancy Rate</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{occupancyRate}%</p>
                </div>
              </div>
              <div className="group relative flex overflow-hidden items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--logo-muted)] text-[var(--logo)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <TrendingUp className="size-4" />
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium text-[#64748b] transition-colors duration-300 group-hover:text-[#475569]">Active Discounts</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a] transition-transform duration-300 group-hover:scale-[1.02]">{activeDiscounts}</p>
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
                      <p className="text-sm font-semibold text-[#0f172a]">Listing views</p>
                      <p className="text-xs text-[#94a3b8]">
                        Views trend for selected date range.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#e2e8f0] bg-white text-xs text-[#0f172a] hover:bg-[#f8fafc]"
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
                    <p className="text-xs text-[#94a3b8]">
                      Distribution of properties by type.
                    </p>
                  </div>
                </div>
                <div className="relative flex items-center gap-4">
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div className="size-28 rounded-full bg-[#e5e7eb]" />
                    <div className="absolute size-24 rounded-full border-[10px] border-t-[var(--logo)] border-r-[#22c55e] border-b-[#f97316] border-l-[#e5e7eb] bg-white" />
                    <div className="absolute text-center">
                      <p className="text-xs text-[#94a3b8]">Total</p>
                      <p className="text-lg font-semibold text-[#0f172a]">{totalProperties}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--logo)]" />
                      <span className="text-[#0f172a]">Rent</span>
                      <span className="ml-auto text-[#94a3b8]">68%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#22c55e]" />
                      <span className="text-[#0f172a]">Sale</span>
                      <span className="ml-auto text-[#94a3b8]">24%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#f97316]" />
                      <span className="text-[#0f172a]">Reserved</span>
                      <span className="ml-auto text-[#94a3b8]">8%</span>
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
                    <p className="text-sm font-semibold text-[#0f172a]">Top performing properties</p>
                    <p className="text-xs text-[#94a3b8]">
                      Based on total views and leads generated.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-x-auto">
                <table className="min-w-[640px] w-full table-auto text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
                    <tr>
                      <th className="px-4 py-2 text-left">Property</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Views</th>
                      <th className="px-4 py-2 text-left">Estimated Leads</th>
                      <th className="px-4 py-2 text-left">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageProperties.map((p) => (
                      <tr key={p.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                        <td className="px-4 py-2 align-middle text-sm text-[#0f172a]">
                          {p.title}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#64748b]">
                          {getPropertyLocation(p)}
                        </td>
                        <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">—</td>
                        <td className="px-4 py-2 align-middle text-xs text-[#0f172a]">—</td>
                        <td className="px-4 py-2 align-middle text-xs text-[#94a3b8]">
                          {p.updated_at ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={properties.length}
                pageSize={PAGE_SIZE}
                currentPage={safePage}
                onPageChange={setPage}
                itemLabel="properties"
              />
            </section>
          </div>
        </main>
      </div>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

