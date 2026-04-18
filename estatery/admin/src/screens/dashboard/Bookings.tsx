"use client";

/**
 * Admin Bookings – cards with accept/reject, detail modal, confirmation before actions.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  X,
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
import { fetchAdminBookings, patchAdminBookingDecision } from "@/lib/api-client";
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

function mergeBookingRow(prev: AdminBookingRow, next: AdminBookingRow): AdminBookingRow {
  return { ...prev, ...next };
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

  const [detailBooking, setDetailBooking] = React.useState<AdminBookingRow | null>(null);
  const [confirm, setConfirm] = React.useState<{
    booking: AdminBookingRow;
    action: "confirm" | "reject";
  } | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

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

  const applyBookingUpdate = React.useCallback((updated: AdminBookingRow) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? mergeBookingRow(r, updated) : r)));
    setDetailBooking((prev) => (prev && prev.id === updated.id ? mergeBookingRow(prev, updated) : prev));
  }, []);

  React.useEffect(() => {
    setActionError(null);
    if (!confirm) {
      setRejectReason("");
      return;
    }
    setRejectReason("");
  }, [confirm]);

  const submitDecision = async () => {
    if (!confirm) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const { booking } = await patchAdminBookingDecision(confirm.booking.id, {
        action: confirm.action === "confirm" ? "confirm" : "reject",
        reason: confirm.action === "reject" ? rejectReason.trim() || undefined : undefined,
      });
      applyBookingUpdate(booking);
      void refetchStats();
      setConfirm(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (booking: AdminBookingRow, action: "confirm" | "reject") => {
    setConfirm({ booking, action });
  };

  const renderBookingActions = (b: AdminBookingRow, source: "card" | "detail") => {
    if (b.status !== "pending") return null;
    return (
      <div
        className={cn("flex flex-wrap gap-2", source === "card" ? "mt-3" : "mt-4")}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => openConfirm(b, "confirm")}
        >
          <Check className="size-3.5" />
          Accept booking
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() => openConfirm(b, "reject")}
        >
          <X className="size-3.5" />
          Reject booking
        </Button>
      </div>
    );
  };

  const detailRows: { label: string; value: React.ReactNode }[] = detailBooking
    ? [
        { label: "Booking ID", value: `#${detailBooking.id}` },
        { label: "Status", value: statusLabel(detailBooking.status) },
        {
          label: "Property",
          value: (
            <button
              type="button"
              className="text-left font-medium text-[var(--logo)] hover:underline"
              onClick={() => navigate(`/dashboard/properties/${detailBooking.property}`)}
            >
              {detailBooking.property_title || `Property #${detailBooking.property}`}
            </button>
          ),
        },
        { label: "City", value: detailBooking.property_city || "—" },
        { label: "Address", value: detailBooking.property_address || "—" },
        { label: "Guest", value: detailBooking.user_name || detailBooking.user_email || "—" },
        { label: "Guest email", value: detailBooking.user_email || "—" },
        { label: "Host", value: detailBooking.host_name || detailBooking.host_email || "—" },
        { label: "Host email", value: detailBooking.host_email || "—" },
        {
          label: "Stay",
          value: (
            <>
              {formatDate(detailBooking.check_in)} → {formatDate(detailBooking.check_out)}
            </>
          ),
        },
        { label: "Guests", value: detailBooking.guests },
        { label: "Booking type", value: detailBooking.booking_type ?? "—" },
        {
          label: "Total",
          value:
            detailBooking.total_price != null
              ? `₵${Number(detailBooking.total_price).toLocaleString()}`
              : "—",
        },
        {
          label: "Monthly rate",
          value:
            detailBooking.agreed_monthly_rate != null
              ? `₵${Number(detailBooking.agreed_monthly_rate).toLocaleString()}`
              : "—",
        },
        { label: "Months booked", value: detailBooking.months_booked ?? "—" },
        {
          label: "Security deposit",
          value:
            detailBooking.security_deposit != null
              ? `₵${Number(detailBooking.security_deposit).toLocaleString()}`
              : "—",
        },
        { label: "Promo", value: detailBooking.applied_promo_code || "—" },
        { label: "Emergency contact", value: detailBooking.emergency_contact || "—" },
        { label: "Occupation", value: detailBooking.occupation || "—" },
        { label: "Special requests", value: detailBooking.special_requests || "—" },
        { label: "Rejection reason", value: detailBooking.rejection_reason || "—" },
        { label: "Booked", value: detailBooking.created_at ? formatDate(detailBooking.created_at) : "—" },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Bookings</h1>
              <p className="mt-1 text-xs text-[#64748b]">
                Review reservations — open a card for full details, accept or reject pending requests.
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
              Click a card for details. Pending bookings can be accepted or rejected (confirmation step).
            </p>
          </div>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="p-4 sm:p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-[var(--logo)]" aria-hidden />
                <p className="mt-2 text-sm text-[#64748b]">Loading bookings…</p>
              </div>
            )}

            {!loading && rows.length === 0 && !error && (
              <p className="py-14 text-center text-sm text-[#94a3b8]">No bookings match your filters.</p>
            )}

            {!loading && rows.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((b) => {
                  const img = apiMediaUrl(b.property_image);
                  const guest = b.user_name || b.user_email || "—";
                  const host = b.host_name || b.host_email || "—";
                  return (
                    <li key={b.id}>
                      <article
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailBooking(b)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDetailBooking(b);
                          }
                        }}
                        className="flex h-full cursor-pointer flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition hover:border-[var(--logo)]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--logo)]/30"
                      >
                        <div className="flex gap-3">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {img ? (
                              <img src={img} alt="" className="size-full object-cover" />
                            ) : (
                              <Building2 className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="truncate text-sm font-semibold text-[#1e293b]">
                                {b.property_title || `Property #${b.property}`}
                              </h3>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                  STATUS_BADGE[b.status] ?? "bg-slate-50 text-slate-700 border-slate-200"
                                )}
                              >
                                {statusLabel(b.status)}
                              </span>
                            </div>
                            {b.property_city && (
                              <p className="truncate text-xs text-[#64748b]">{b.property_city}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 border-t border-[#f1f5f9] pt-3 text-xs text-[#475569]">
                          <div className="flex items-start gap-2">
                            <User className="mt-0.5 size-3.5 shrink-0 text-[#94a3b8]" />
                            <div className="min-w-0">
                              <p className="font-medium text-[#1e293b]">{guest}</p>
                              {b.user_email && <p className="truncate text-[10px] text-[#64748b]">{b.user_email}</p>}
                            </div>
                          </div>
                          <p className="truncate">
                            <span className="text-[#94a3b8]">Host:</span> {host}
                          </p>
                          <p>
                            {formatDate(b.check_in)} → {formatDate(b.check_out)}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3.5 text-[#94a3b8]" />
                              {b.guests} guest{b.guests === 1 ? "" : "s"}
                            </span>
                            <span className="font-semibold tabular-nums text-[#0f172a]">
                              {b.total_price != null ? `₵${Number(b.total_price).toLocaleString()}` : "—"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] pt-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/properties/${b.property}`)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--logo)] hover:underline"
                          >
                            Open property
                            <ArrowUpRight className="size-3" />
                          </button>
                        </div>

                        {renderBookingActions(b, "card")}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
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

      {/* Detail modal */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close details"
            onClick={() => setDetailBooking(null)}
          />
          <div
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#e2e8f0] bg-white px-5 py-4">
              <h2 id="booking-detail-title" className="text-lg font-semibold text-[#1e293b]">
                Booking details
              </h2>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setDetailBooking(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              {detailRows.map((row) => (
                <div key={row.label} className="grid grid-cols-[120px_1fr] gap-2 border-b border-[#f8fafc] pb-2 last:border-0">
                  <span className="text-[#64748b]">{row.label}</span>
                  <div className="min-w-0 break-words text-[#1e293b]">{row.value}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e2e8f0] px-5 py-4">
              {renderBookingActions(detailBooking, "detail")}
              {detailBooking.status !== "pending" && (
                <p className="text-xs text-[#64748b]">Only pending bookings can be accepted or rejected.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm accept / reject */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close confirmation"
            onClick={() => !actionLoading && setConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1e293b]">
              {confirm.action === "confirm" ? "Accept this booking?" : "Reject this booking?"}
            </h3>
            <p className="mt-2 text-sm text-[#64748b]">
              {confirm.booking.property_title || `Property #${confirm.booking.property}`} ·{" "}
              {confirm.booking.user_name || confirm.booking.user_email || "Guest"} ·{" "}
              {formatDate(confirm.booking.check_in)} → {formatDate(confirm.booking.check_out)}
            </p>
            {confirm.action === "reject" && (
              <div className="mt-4">
                <label htmlFor="reject-reason" className="text-xs font-medium text-[#475569]">
                  Reason (optional)
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Shown to the guest in the rejection email when email is enabled."
                  className="mt-1 w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
            )}
            {actionError && <p className="mt-3 text-sm text-rose-600">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => setConfirm(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                className={cn(
                  "rounded-xl text-white",
                  confirm.action === "confirm"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                )}
                onClick={() => void submitDecision()}
              >
                {actionLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Working…
                  </span>
                ) : confirm.action === "confirm" ? (
                  "Accept booking"
                ) : (
                  "Reject booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
