"use client";

/**
 * Admin Bookings – all tenant bookings across the platform (from client-side bookings).
 * Search, status filter, sort, pagination, and at-a-glance status counts.
 */
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  CalendarRange,
  ArrowUpRight,
  Loader2,
  Building2,
  User,
  Users,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";
import { fetchAdminBookings } from "@/lib/api-client";
import type { AdminBookingRow } from "@/lib/api-types";
import { apiMediaUrl } from "@/lib/properties";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
] as const;

const ORDER_OPTIONS: { value: string; label: string }[] = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "check_in", label: "Check-in (soonest)" },
  { value: "-check_in", label: "Check-in (latest)" },
  { value: "-total_price", label: "Total (high → low)" },
  { value: "total_price", label: "Total (low → high)" },
  { value: "status", label: "Status (A–Z)" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-sky-50 text-sky-800 border-sky-200",
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  completed: "bg-violet-50 text-violet-800 border-violet-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(s: string) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Bookings() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [ordering, setOrdering] = React.useState("-created_at");
  const [rows, setRows] = React.useState<AdminBookingRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<{
    all: number;
    pending: number;
    confirmed: number;
    active: number;
    completed: number;
    cancelled: number;
    rejected: number;
  } | null>(null);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, ordering]);

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminBookings({
        page,
        page_size: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        ordering,
      });
      setRows(data.results);
      setTotalCount(data.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, ordering]);

  React.useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  React.useEffect(() => {
    let cancelled = false;
    const statuses = ["pending", "confirmed", "active", "completed", "cancelled", "rejected"] as const;
    (async () => {
      try {
        const [allRes, ...byStatus] = await Promise.all([
          fetchAdminBookings({ page: 1, page_size: 1 }),
          ...statuses.map((s) => fetchAdminBookings({ page: 1, page_size: 1, status: s })),
        ]);
        if (cancelled) return;
        setStats({
          all: allRes.count,
          pending: byStatus[0].count,
          confirmed: byStatus[1].count,
          active: byStatus[2].count,
          completed: byStatus[3].count,
          cancelled: byStatus[4].count,
          rejected: byStatus[5].count,
        });
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refetchStats = React.useCallback(async () => {
    const statuses = ["pending", "confirmed", "active", "completed", "cancelled", "rejected"] as const;
    try {
      const [allRes, ...byStatus] = await Promise.all([
        fetchAdminBookings({ page: 1, page_size: 1 }),
        ...statuses.map((s) => fetchAdminBookings({ page: 1, page_size: 1, status: s })),
      ]);
      setStats({
        all: allRes.count,
        pending: byStatus[0].count,
        confirmed: byStatus[1].count,
        active: byStatus[2].count,
        completed: byStatus[3].count,
        cancelled: byStatus[4].count,
        rejected: byStatus[5].count,
      });
    } catch {
      setStats(null);
    }
  }, []);

  const handleRefresh = () => {
    void refetchStats();
    void loadBookings();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Bookings</h1>
              <p className="mt-1 text-xs text-[#64748b]">
                All reservations from the client site — search guests, filter by status, open the listing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-[#e2e8f0]"
                onClick={() => handleRefresh()}
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Guest, email, property, city…"
                  className="h-9 w-56 rounded-xl border-[#e2e8f0] bg-white pl-9 pr-3 text-sm placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-xl border-[#e2e8f0] bg-white px-3 text-sm">
                  <Filter className="mr-1.5 size-4 text-[#64748b]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ordering} onValueChange={setOrdering}>
                <SelectTrigger className="h-9 min-w-[160px] rounded-xl border-[#e2e8f0] bg-white px-3 text-sm">
                  <CalendarRange className="mr-1.5 size-4 shrink-0 text-[#64748b]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {(
              [
                ["all", "Total", stats.all, "border-slate-200 bg-white text-[#0f172a]"],
                ["pending", "Pending", stats.pending, "border-amber-200 bg-amber-50/80 text-amber-900"],
                ["confirmed", "Confirmed", stats.confirmed, "border-sky-200 bg-sky-50/80 text-sky-900"],
                ["active", "Active", stats.active, "border-emerald-200 bg-emerald-50/80 text-emerald-900"],
                ["completed", "Completed", stats.completed, "border-violet-200 bg-violet-50/80 text-violet-900"],
                ["cancelled", "Cancelled", stats.cancelled, "border-slate-200 bg-slate-50 text-slate-700"],
                ["rejected", "Rejected", stats.rejected, "border-rose-200 bg-rose-50/80 text-rose-900"],
              ] as const
            ).map(([key, label, n, cardClass]) => {
              const isActive =
                key === "all" ? statusFilter === "all" : statusFilter === key;
              return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key === "all" ? "all" : key)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left shadow-sm transition hover:ring-2 hover:ring-[var(--logo)]/20",
                  cardClass,
                  isActive ? "ring-2 ring-[var(--logo)]/40" : ""
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{n}</p>
              </button>
            );
            })}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="border-b border-[#e2e8f0] bg-[#fafbfc] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#1e293b]">All bookings</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Linked to listings on the platform — use search and filters to narrow the list.
            </p>
          </div>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Property
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Guest
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Host
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Stay
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Guests
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Total
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                    Payments
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Loader2 className="mx-auto size-8 animate-spin text-[var(--logo)]" aria-hidden />
                      <p className="mt-2 text-[#64748b]">Loading bookings…</p>
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((b) => {
                    const img = apiMediaUrl(b.property_image);
                    const guest = b.user_name || b.user_email || "—";
                    const host = b.host_name || b.host_email || "—";
                    return (
                      <tr key={b.id} className="group transition-colors hover:bg-[#f8fafc]">
                        <td className="px-4 py-3">
                          <div className="flex max-w-[220px] items-center gap-3">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {img ? (
                                <img src={img} alt="" className="size-full object-cover" />
                              ) : (
                                <Building2 className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/properties/${b.property}`)}
                                className="inline-flex max-w-full items-center gap-1 truncate text-left font-medium text-[var(--logo)] hover:text-[var(--logo-hover)]"
                              >
                                <span className="truncate">{b.property_title || `Property #${b.property}`}</span>
                                <ArrowUpRight className="size-3 shrink-0" />
                              </button>
                              {b.property_city && (
                                <p className="truncate text-[10px] text-[#64748b]">{b.property_city}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[160px] px-4 py-3">
                          <div className="flex items-start gap-2">
                            <User className="mt-0.5 size-3.5 shrink-0 text-[#94a3b8]" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#1e293b]">{guest}</p>
                              {b.user_email && (
                                <p className="truncate text-[10px] text-[#64748b]">{b.user_email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-[#475569]">
                          <p className="truncate">{host}</p>
                          {b.host_email && b.host_name && (
                            <p className="truncate text-[10px] text-[#94a3b8]">{b.host_email}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#475569]">
                          <p>
                            {formatDate(b.check_in)} → {formatDate(b.check_out)}
                          </p>
                          {b.created_at && (
                            <p className="text-[10px] text-[#94a3b8]">
                              Booked {formatDate(b.created_at)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[#475569]">
                            <Users className="size-3.5 text-[#94a3b8]" />
                            {b.guests}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-[#0f172a]">
                          {b.total_price != null ? `₵${Number(b.total_price).toLocaleString()}` : "—"}
                          {b.applied_promo_code && (
                            <p className="text-[10px] font-normal text-emerald-600">Promo {b.applied_promo_code}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize",
                              STATUS_BADGE[b.status] ?? "bg-slate-50 text-slate-700 border-slate-200"
                            )}
                          >
                            {statusLabel(b.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/dashboard/transactions?booking=${b.id}`}
                            className="text-[11px] font-semibold text-[var(--logo)] hover:underline"
                          >
                            Bulk record
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                {!loading && rows.length === 0 && !error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-[#94a3b8]">
                      No bookings match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalCount > 0 && (
            <div className="px-4 pb-4 pt-2">
              <Pagination
                totalItems={totalCount}
                pageSize={PAGE_SIZE}
                currentPage={page}
                onPageChange={setPage}
                itemLabel="bookings"
              />
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
