"use client";

/**
 * Admin Bookings – card layout with approve/reject, confirmation step, and detail modal.
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
  CheckCircle2,
  XCircle,
  X,
  LayoutGrid,
  Table2,
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
import { Label } from "@/components/ui/label";
import { cn, formatGhanaCedi } from "@/lib/utils";
import { fetchAdminBookings, patchAdminBookingDecision } from "@/lib/api-client";
import type { AdminBookingRow } from "@/lib/api-types";
import { apiMediaUrl } from "@/lib/properties";

const PAGE_SIZE = 20;

const BOOKINGS_VIEW_KEY = "estatery-admin-bookings-view";
type BookingsViewMode = "cards" | "table";

function readStoredViewMode(): BookingsViewMode {
  if (typeof window === "undefined") return "cards";
  const v = window.localStorage.getItem(BOOKINGS_VIEW_KEY);
  return v === "table" ? "table" : "cards";
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Approved" },
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
  if (s === "confirmed") return "Approved";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ConfirmState = {
  booking: AdminBookingRow;
  action: "confirm" | "reject" | "cancel";
};

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
  const [confirmState, setConfirmState] = React.useState<ConfirmState | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [decisionError, setDecisionError] = React.useState<string | null>(null);
  const [decidingId, setDecidingId] = React.useState<number | null>(null);
  const [viewMode, setViewMode] = React.useState<BookingsViewMode>(() =>
    typeof window !== "undefined" ? readStoredViewMode() : "cards"
  );

  React.useEffect(() => {
    try {
      window.localStorage.setItem(BOOKINGS_VIEW_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

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

  const mergeUpdatedRow = (updated: AdminBookingRow) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setDetailBooking((d) => (d && d.id === updated.id ? updated : d));
  };

  const submitDecision = async () => {
    if (!confirmState) return;
    setDecisionError(null);
    setDecidingId(confirmState.booking.id);
    try {
      const { booking } = await patchAdminBookingDecision(confirmState.booking.id, {
        action: confirmState.action,
        reason:
          confirmState.action === "reject" || confirmState.action === "cancel"
            ? rejectReason.trim() || undefined
            : undefined,
      });
      mergeUpdatedRow(booking);
      setConfirmState(null);
      setRejectReason("");
      void refetchStats();
    } catch (e) {
      setDecisionError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setDecidingId(null);
    }
  };

  const openConfirm = (booking: AdminBookingRow, action: "confirm" | "reject" | "cancel") => {
    setDecisionError(null);
    setRejectReason("");
    setConfirmState({ booking, action });
  };

  const renderBookingCard = (b: AdminBookingRow) => {
    const img = apiMediaUrl(b.property_image);
    const guest = b.user_name || b.user_email || "—";
    const host = b.host_name || b.host_email || "—";
    const isPending = b.status === "pending";
    const canCancel = b.status === "pending" || b.status === "confirmed" || b.status === "active";

    return (
      <article
        key={b.id}
        role="button"
        tabIndex={0}
        onClick={() => setDetailBooking(b)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailBooking(b);
          }
        }}
        className={cn(
          "flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition outline-none hover:border-[#cbd5e1] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--logo)]/30"
        )}
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/properties/${b.property}`);
              }}
              className="inline-flex max-w-full items-center gap-1 text-left font-semibold text-[var(--logo)] hover:text-[var(--logo-hover)]"
            >
              <span className="truncate">{b.property_title || `Property #${b.property}`}</span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </button>
            {b.property_city && <p className="truncate text-xs text-[#64748b]">{b.property_city}</p>}
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize",
                STATUS_BADGE[b.status] ?? "bg-slate-50 text-slate-700 border-slate-200"
              )}
            >
              {statusLabel(b.status)}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2 border-t border-[#f1f5f9] pt-3 text-sm text-[#475569]">
          <div className="flex items-start gap-2">
            <User className="mt-0.5 size-3.5 shrink-0 text-[#94a3b8]" />
            <div className="min-w-0">
              <p className="truncate font-medium text-[#1e293b]">{guest}</p>
              {b.user_email ? <p className="truncate text-xs text-[#64748b]">{b.user_email}</p> : null}
            </div>
          </div>
          <p className="text-xs">
            <span className="text-[#94a3b8]">Host:</span> <span className="text-[#334155]">{host}</span>
          </p>
          <p className="text-xs">
            {formatDate(b.check_in)} → {formatDate(b.check_out)}
            {b.guests != null ? (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[#64748b]">
                <Users className="size-3" />
                {b.guests}
              </span>
            ) : null}
          </p>
          <p className="font-semibold tabular-nums text-[#0f172a]">
            {b.total_price != null ? formatGhanaCedi(b.total_price, 0) : "—"}
            {b.applied_promo_code ? (
              <span className="ml-2 text-[10px] font-normal text-emerald-600">Promo {b.applied_promo_code}</span>
            ) : null}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] pt-3">
          {isPending ? (
            <>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirm(b, "confirm");
                }}
              >
                <CheckCircle2 className="size-3.5" />
                Approve booking
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirm(b, "reject");
                }}
              >
                <XCircle className="size-3.5" />
                Reject booking
              </Button>
            </>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={(e) => {
                e.stopPropagation();
                openConfirm(b, "cancel");
              }}
            >
              <XCircle className="size-3.5" />
              Cancel booking
            </Button>
          ) : null}
          <Link
            to={`/dashboard/transactions?booking=${b.id}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto text-xs font-semibold text-[var(--logo)] hover:underline"
          >
            Payments
          </Link>
        </div>
      </article>
    );
  };

  const renderDetailFields = (b: AdminBookingRow) => (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {[
        ["Property", b.property_title || `#${b.property}`],
        ["City", b.property_city || "—"],
        ["Guest", b.user_name || b.user_email || "—"],
        ["Email", b.user_email || "—"],
        ["Host", b.host_name || b.host_email || "—"],
        ["Check-in", formatDate(b.check_in)],
        ["Check-out", formatDate(b.check_out)],
        ["Guests", String(b.guests ?? "—")],
        ["Total", b.total_price != null ? formatGhanaCedi(b.total_price, 0) : "—"],
        ["Monthly rate", b.agreed_monthly_rate ?? "—"],
        ["Months", b.months_booked != null ? String(b.months_booked) : "—"],
        ["Security deposit", b.security_deposit ?? "—"],
        ["Promo", b.applied_promo_code || "—"],
        [
          "Payment channel",
          b.tenant_payment_channel === "momo_card"
            ? "MoMo or card"
            : b.tenant_payment_channel === "offline"
              ? "Bank transfer or cash"
              : b.tenant_payment_channel || "—",
        ],
        ["Emergency contact", b.emergency_contact || "—"],
        ["Occupation", b.occupation || "—"],
        ["Special requests", b.special_requests || "—"],
        ["Created", b.created_at ? formatDate(b.created_at) : "—"],
        ["Confirmed at", b.confirmed_at ? formatDate(b.confirmed_at) : "—"],
      ].map(([k, v]) => (
        <div key={k} className="sm:col-span-1">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">{k}</dt>
          <dd className="mt-0.5 text-[#1e293b]">{v}</dd>
        </div>
      ))}
      {b.rejection_reason ? (
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Rejection reason</dt>
          <dd className="mt-0.5 text-rose-900">{b.rejection_reason}</dd>
        </div>
      ) : null}
    </dl>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Bookings</h1>
              <p className="mt-1 text-xs text-[#64748b]">
                Review requests, approve or reject, then guests can pay online (MoMo/card) once approved.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-0.5"
                role="group"
                aria-label="Booking layout"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition",
                    viewMode === "cards"
                      ? "bg-white text-[var(--logo)] shadow-sm"
                      : "text-[#64748b] hover:text-[#1e293b]"
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition",
                    viewMode === "table"
                      ? "bg-white text-[var(--logo)] shadow-sm"
                      : "text-[#64748b] hover:text-[#1e293b]"
                  )}
                >
                  <Table2 className="size-3.5" />
                  Table
                </button>
              </div>
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
                ["confirmed", "Approved", stats.confirmed, "border-sky-200 bg-sky-50/80 text-sky-900"],
                ["active", "Active", stats.active, "border-emerald-200 bg-emerald-50/80 text-emerald-900"],
                ["completed", "Completed", stats.completed, "border-violet-200 bg-violet-50/80 text-violet-900"],
                ["cancelled", "Cancelled", stats.cancelled, "border-slate-200 bg-slate-50 text-slate-700"],
                ["rejected", "Rejected", stats.rejected, "border-rose-200 bg-rose-50/80 text-rose-900"],
              ] as const
            ).map(([key, label, n, cardClass]) => {
              const isActive = key === "all" ? statusFilter === "all" : statusFilter === key;
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
              {viewMode === "cards"
                ? "Click a card for full details. Pending bookings can be approved or rejected from the card or detail view."
                : "Scan rows in table view — open details from a row or use Approve / Reject for pending bookings."}
            </p>
          </div>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          )}

          <div className="p-4">
            {loading && (
              <div className="flex flex-col items-center py-16">
                <Loader2 className="size-8 animate-spin text-[var(--logo)]" aria-hidden />
                <p className="mt-2 text-[#64748b]">Loading bookings…</p>
              </div>
            )}
            {!loading && rows.length > 0 && viewMode === "cards" && (
              <div className="grid gap-4 sm:grid-cols-2">{rows.map((b) => renderBookingCard(b))}</div>
            )}
            {!loading && rows.length > 0 && viewMode === "table" && (
              <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
                <table className="w-full min-w-[920px] text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Property
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Guest
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Host
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Stay
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Guests
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider text-[#64748b]">
                        Total
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[#64748b]">
                        Status
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider text-[#64748b]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {rows.map((b) => {
                      const img = apiMediaUrl(b.property_image);
                      const guest = b.user_name || b.user_email || "—";
                      const host = b.host_name || b.host_email || "—";
                      const isPending = b.status === "pending";
                      const canCancel = b.status === "pending" || b.status === "confirmed" || b.status === "active";
                      return (
                        <tr
                          key={b.id}
                          className="cursor-pointer bg-white transition-colors hover:bg-[#f8fafc]"
                          onClick={() => setDetailBooking(b)}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex max-w-[200px] items-center gap-2">
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                {img ? (
                                  <img src={img} alt="" className="size-full object-cover" />
                                ) : (
                                  <Building2 className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                                )}
                              </div>
                              <button
                                type="button"
                                className="truncate text-left font-medium text-[var(--logo)] hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/properties/${b.property}`);
                                }}
                              >
                                {b.property_title || `Property #${b.property}`}
                              </button>
                            </div>
                          </td>
                          <td className="max-w-[140px] px-3 py-2.5">
                            <p className="truncate font-medium text-[#1e293b]">{guest}</p>
                            {b.user_email ? (
                              <p className="truncate text-[10px] text-[#64748b]">{b.user_email}</p>
                            ) : null}
                          </td>
                          <td className="max-w-[120px] truncate px-3 py-2.5 text-[#475569]">{host}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-[#475569]">
                            {formatDate(b.check_in)} → {formatDate(b.check_out)}
                          </td>
                          <td className="px-3 py-2.5 text-[#475569]">{b.guests}</td>
                          <td className="px-3 py-2.5 text-right font-medium tabular-nums text-[#0f172a]">
                            {b.total_price != null ? formatGhanaCedi(b.total_price, 0) : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                                STATUS_BADGE[b.status] ?? "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              {statusLabel(b.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {isPending ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 border-emerald-200 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => openConfirm(b, "confirm")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 border-rose-200 px-2 text-[10px] text-rose-700 hover:bg-rose-50"
                                    onClick={() => openConfirm(b, "reject")}
                                  >
                                    Reject
                                  </Button>
                                </>
                              ) : null}
                              {canCancel ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 border-rose-200 px-2 text-[10px] text-rose-700 hover:bg-rose-50"
                                  onClick={() => openConfirm(b, "cancel")}
                                >
                                  Cancel
                                </Button>
                              ) : null}
                              <Link
                                to={`/dashboard/transactions?booking=${b.id}`}
                                className="text-[10px] font-semibold text-[var(--logo)] hover:underline"
                              >
                                Payments
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && rows.length === 0 && !error && (
              <p className="py-14 text-center text-[#94a3b8]">No bookings match your filters.</p>
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

      {detailBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setDetailBooking(null)}
          role="presentation"
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#e2e8f0] bg-white shadow-xl sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">Booking</p>
                <h2 id="booking-detail-title" className="text-lg font-bold text-[#1e293b]">
                  #{detailBooking.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="flex size-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 px-4 py-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize",
                    STATUS_BADGE[detailBooking.status] ?? "bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  {statusLabel(detailBooking.status)}
                </span>
              </div>
              {renderDetailFields(detailBooking)}
              <div className="flex flex-wrap gap-2 border-t border-[#f1f5f9] pt-4">
                {detailBooking.status === "pending" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => openConfirm(detailBooking, "confirm")}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Approve booking
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => openConfirm(detailBooking, "reject")}
                    >
                      <XCircle className="size-3.5" />
                      Reject booking
                    </Button>
                  </>
                ) : null}
                {detailBooking.status === "pending" ||
                detailBooking.status === "confirmed" ||
                detailBooking.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => openConfirm(detailBooking, "cancel")}
                  >
                    <XCircle className="size-3.5" />
                    Cancel booking
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" className="ml-auto" asChild>
                  <Link to={`/dashboard/transactions?booking=${detailBooking.id}`} onClick={() => setDetailBooking(null)}>
                    Open payments
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => {
            if (decidingId == null) {
              setConfirmState(null);
              setRejectReason("");
              setDecisionError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-decision-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-decision-title" className="text-lg font-semibold text-[#1e293b]">
              {confirmState.action === "confirm"
                ? "Approve this booking?"
                : confirmState.action === "reject"
                  ? "Reject this booking?"
                  : "Cancel this booking?"}
            </h3>
            <p className="mt-2 text-sm text-[#64748b]">
              {confirmState.action === "confirm"
                ? "The guest will be able to choose MoMo or card checkout (when enabled) or bank transfer/cash."
                : confirmState.action === "reject"
                  ? "The guest will be notified that this request was rejected."
                  : "The guest and host will be notified that this booking was cancelled."}
            </p>
            <p className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-sm text-[#334155]">
              <span className="font-medium">{confirmState.booking.property_title || `Property #${confirmState.booking.property}`}</span>
              <span className="text-[#94a3b8]"> · </span>
              {formatDate(confirmState.booking.check_in)} → {formatDate(confirmState.booking.check_out)}
            </p>
            {confirmState.action === "reject" || confirmState.action === "cancel" ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="reject-reason" className="text-[#1e293b]">
                  {confirmState.action === "cancel" ? "Cancellation reason (optional)" : "Reason (optional)"}
                </Label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Shown to the guest when helpful"
                  className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                />
              </div>
            ) : null}
            {decisionError ? <p className="mt-3 text-sm text-rose-700">{decisionError}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={decidingId != null}
                onClick={() => {
                  setConfirmState(null);
                  setRejectReason("");
                  setDecisionError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={decidingId != null}
                className={
                  confirmState.action === "confirm"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }
                onClick={() => void submitDecision()}
              >
                {decidingId != null ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Working…
                  </>
                ) : confirmState.action === "confirm" ? (
                  "Approve"
                ) : confirmState.action === "reject" ? (
                  "Reject"
                ) : (
                  "Cancel booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
