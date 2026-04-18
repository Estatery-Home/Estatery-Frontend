"use client";

/**
 * Transactions — booking payment schedule (deposit + rent) from GET /api/host/payments/.
 * Host records receipts manually (no in-app card checkout). Mark paid via PATCH /api/payments/:id/mark-paid/.
 */
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  RefreshCw,
  Download,
  Search,
  Filter,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Landmark,
  TrendingUp,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { format, subMonths, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui";
import { cn, formatDashboardCurrency } from "@/lib/utils";
import { bulkMarkBookingPaymentsPaid, fetchHostDashboard, fetchHostPayments, markHostPaymentPaid } from "@/lib/api-client";
import type { HostDashboardResponse, HostRecentPaymentRow } from "@/lib/api-types";

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  rent: "Rent",
  late_fee: "Late fee",
  utility: "Utility",
  damage: "Damage",
  refund: "Refund",
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  pending: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
  overdue: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80",
  refunded: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/70",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
};

type Period = "weekly" | "monthly" | "yearly";

function parseAmount(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function CollectedChart({
  payments,
  period,
  currency,
}: {
  payments: HostRecentPaymentRow[];
  period: Period;
  currency: string;
}) {
  const { labels, values } = React.useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid" && p.paid_date);
    const now = new Date();

    if (period === "monthly") {
      const pts: { label: string; v: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const prefix = format(d, "yyyy-MM");
        const label = format(d, "MMM");
        const v = paid
          .filter((p) => p.paid_date!.startsWith(prefix))
          .reduce((s, p) => s + parseAmount(p.amount), 0);
        pts.push({ label, v });
      }
      return { labels: pts.map((p) => p.label), values: pts.map((p) => p.v) };
    }

    if (period === "weekly") {
      const start = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 7);
      const weeks = eachWeekOfInterval({ start, end: now }, { weekStartsOn: 1 }).slice(-8);
      const pts = weeks.map((wStart) => {
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        const label = `${format(wStart, "d MMM")}`;
        const v = paid.filter((p) => {
          const pd = new Date(p.paid_date!);
          return pd >= wStart && pd <= wEnd;
        }).reduce((s, p) => s + parseAmount(p.amount), 0);
        return { label, v };
      });
      return { labels: pts.map((p) => p.label), values: pts.map((p) => p.v) };
    }

    // yearly → quarters current year
    const y = now.getFullYear();
    const pts: { label: string; v: number }[] = [];
    for (let q = 0; q < 4; q++) {
      const startM = q * 3 + 1;
      const endM = startM + 2;
      const v = paid
        .filter((p) => {
          const pd = new Date(p.paid_date!);
          return pd.getFullYear() === y && pd.getMonth() + 1 >= startM && pd.getMonth() + 1 <= endM;
        })
        .reduce((s, p) => s + parseAmount(p.amount), 0);
      pts.push({ label: `Q${q + 1}`, v });
    }
    return { labels: pts.map((p) => p.label), values: pts.map((p) => p.v) };
  }, [payments, period]);

  const maxV = Math.max(1, ...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collected</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {formatDashboardCurrency(currency, total)}
          </p>
          <p className="text-xs text-slate-500">Sum of recorded payouts in this view</p>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600">
          <TrendingUp className="size-4" />
          <span className="text-sm font-medium">By {period === "weekly" ? "week" : period === "monthly" ? "month" : "quarter"}</span>
        </div>
      </div>
      <div className="flex h-36 items-end gap-1.5">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full max-w-[3rem] rounded-t-lg bg-gradient-to-t from-[var(--logo)]/85 to-[var(--logo)]/60 transition-all hover:from-[var(--logo)] hover:to-[var(--logo-hover)]/90"
              style={{ height: `${Math.max(8, (v / maxV) * 100)}%` }}
              title={formatDashboardCurrency(currency, v)}
            />
            <span className="max-w-full truncate text-[10px] font-medium text-slate-500">{labels[i]}</span>
          </div>
        ))}
      </div>
      {values.every((v) => v === 0) && (
        <p className="mt-3 text-center text-xs text-slate-400">No paid installments in this range yet.</p>
      )}
    </div>
  );
}

function RecordPaymentModal({
  open,
  payment,
  onClose,
  onDone,
  currency,
}: {
  open: boolean;
  payment: HostRecentPaymentRow | null;
  onClose: () => void;
  onDone: () => void;
  currency: string;
}) {
  const [ref, setRef] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setRef("");
      setErr(null);
    }
  }, [open, payment]);

  if (!open || !payment) return null;

  const submit = () => {
    setBusy(true);
    setErr(null);
    void markHostPaymentPaid(payment.id, ref.trim() || undefined).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setErr(r.message ?? "Could not update payment.");
        return;
      }
      onDone();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Record payment received</h3>
        <p className="mt-2 text-sm text-slate-600">
          Mark this installment as paid after you confirm funds (transfer, MoMo, cash, etc.). Optional reference helps
          your records.
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">{payment.property_title ?? "Property"}</p>
          <p className="text-slate-600">{payment.customer}</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {formatDashboardCurrency(currency, payment.amount)}{" "}
            <span className="text-xs font-normal text-slate-500">· {PAYMENT_TYPE_LABEL[payment.payment_type] ?? payment.payment_type}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Due {payment.due_date}</p>
        </div>
        <label className="mt-4 block text-xs font-medium text-slate-700">
          Reference (optional)
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. MoMo TXN ID"
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
          />
        </label>
        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy} className="border-slate-200">
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={submit} className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]">
            {busy ? "Saving…" : "Mark as paid"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type BulkPreset = "6" | "12" | "24" | "custom";

function BulkAdvancePaymentModal({
  open,
  onClose,
  payments,
  onDone,
  initialBookingId,
}: {
  open: boolean;
  onClose: () => void;
  payments: HostRecentPaymentRow[];
  onDone: () => void;
  initialBookingId: number | null;
}) {
  const [bookingId, setBookingId] = React.useState<string>("");
  const [preset, setPreset] = React.useState<BulkPreset>("12");
  const [customCount, setCustomCount] = React.useState(12);
  const [includeDeposit, setIncludeDeposit] = React.useState(false);
  const [ref, setRef] = React.useState("");
  const [method, setMethod] = React.useState<"bank" | "momo" | "card">("bank");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    setBusy(false);
    if (initialBookingId != null) {
      setBookingId(String(initialBookingId));
    } else {
      setBookingId("");
    }
  }, [open, initialBookingId]);

  const bookingChoices = React.useMemo(() => {
    const m = new Map<number, { title: string; customer: string; pendingRent: number; hasDeposit: boolean }>();
    for (const p of payments) {
      if (p.status !== "pending" && p.status !== "overdue") continue;
      const cur = m.get(p.booking) ?? {
        title: p.property_title ?? "",
        customer: p.customer ?? "",
        pendingRent: 0,
        hasDeposit: false,
      };
      if (p.payment_type === "rent") cur.pendingRent += 1;
      if (p.payment_type === "deposit") cur.hasDeposit = true;
      m.set(p.booking, cur);
    }
    return Array.from(m.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.id - a.id);
  }, [payments]);

  const selectedId = bookingId.trim() ? Number(bookingId) : NaN;
  const pendingRentForBooking = React.useMemo(() => {
    if (!Number.isFinite(selectedId)) return 0;
    return payments.filter(
      (p) =>
        p.booking === selectedId &&
        p.payment_type === "rent" &&
        (p.status === "pending" || p.status === "overdue")
    ).length;
  }, [payments, selectedId]);

  const hasPendingDeposit = React.useMemo(() => {
    if (!Number.isFinite(selectedId)) return false;
    return payments.some(
      (p) =>
        p.booking === selectedId &&
        p.payment_type === "deposit" &&
        (p.status === "pending" || p.status === "overdue")
    );
  }, [payments, selectedId]);

  const rentInstallments =
    preset === "custom" ? Math.min(60, Math.max(0, Math.floor(customCount))) : Number(preset);

  if (!open) return null;

  const submit = () => {
    if (!Number.isFinite(selectedId) || selectedId < 1) {
      setErr("Choose a booking.");
      return;
    }
    const rentN = rentInstallments;
    if (rentN < 1 && !(includeDeposit && hasPendingDeposit)) {
      setErr("Select at least one rent month, or tick deposit if that line is still due.");
      return;
    }
    setBusy(true);
    setErr(null);
    void bulkMarkBookingPaymentsPaid(selectedId, {
      rent_installments_to_mark: rentN,
      include_deposit: includeDeposit,
      transaction_id: ref.trim() || undefined,
      payment_method: method,
    }).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setErr(r.message ?? "Could not record bulk payment.");
        return;
      }
      onDone();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--logo-muted)] text-[var(--logo)]">
            <Layers className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Record advance payment (bulk)</h3>
            <p className="mt-1 text-sm text-slate-600">
              When a tenant pays several months (or years) upfront, mark the matching rent lines in one step. Oldest due
              installments are marked first. Platform admins can enter any booking ID they manage.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-slate-700">
            Booking ID
            <input
              list="estatery-bulk-booking-ids"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g. 42 — pick from list or type ID"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            />
            <datalist id="estatery-bulk-booking-ids">
              {bookingChoices.map((b) => (
                <option
                  key={b.id}
                  value={String(b.id)}
                  label={`${b.title || "Property"} · ${b.pendingRent} rent · ${b.customer || "tenant"}`}
                />
              ))}
            </datalist>
          </label>

          {Number.isFinite(selectedId) ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              This booking has <strong className="text-slate-900">{pendingRentForBooking}</strong> pending/overdue rent
              row{pendingRentForBooking !== 1 ? "s" : ""}.
              {hasPendingDeposit ? (
                <>
                  {" "}
                  A <strong className="text-slate-900">security deposit</strong> line is still outstanding—use the checkbox
                  below if they paid it with this transfer.
                </>
              ) : null}
            </p>
          ) : null}

          <div>
            <p className="text-xs font-medium text-slate-700">Rent installments to mark</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["6", "12", "24"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setPreset(n);
                    setCustomCount(Number(n));
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold transition",
                    preset === n ? "bg-[var(--logo)] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {n} months
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPreset("custom")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  preset === "custom" ? "bg-[var(--logo)] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                Custom
              </button>
            </div>
            {preset === "custom" ? (
              <label className="mt-3 block text-xs text-slate-600">
                Count (0–60; use 0 with “deposit only”)
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={customCount}
                  onChange={(e) => setCustomCount(Number(e.target.value))}
                  className="mt-1 block w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeDeposit}
              onChange={(e) => setIncludeDeposit(e.target.checked)}
              className="size-4 rounded border-slate-300"
            />
            Also mark security deposit (if still pending)
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Payment method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "bank" | "momo" | "card")}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="bank">Bank transfer</option>
              <option value="momo">Mobile money</option>
              <option value="card">Card</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Reference / transaction ID (optional, applied to each line)
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. MoMo ref or bank narration"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            />
          </label>

          <p className="text-xs text-slate-500">
            Lines we will try to mark (max available on server may be lower):{" "}
            <strong className="text-slate-800">
              {(includeDeposit && hasPendingDeposit ? 1 : 0) + rentInstallments}
            </strong>
            .
          </p>
        </div>

        {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" type="button" onClick={() => onClose()} disabled={busy} className="border-slate-200">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={submit}
            className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
          >
            {busy ? "Saving…" : "Mark installments paid"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingFromUrl = React.useMemo(() => {
    const raw = searchParams.get("booking");
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [searchParams]);

  const [payments, setPayments] = React.useState<HostRecentPaymentRow[]>([]);
  const [summary, setSummary] = React.useState({
    count: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    cancelled: 0,
    refunded: 0,
  });
  const [dash, setDash] = React.useState<HostDashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [period, setPeriod] = React.useState<Period>("monthly");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [recordPayment, setRecordPayment] = React.useState<HostRecentPaymentRow | null>(null);
  const [bulkOpen, setBulkOpen] = React.useState(false);

  const clearBookingQueryParam = React.useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("booking");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    if (loading) return;
    if (bookingFromUrl != null) {
      setBulkOpen(true);
    }
  }, [loading, bookingFromUrl]);

  const currency = dash?.currency ?? "ghs";

  const load = React.useCallback(async () => {
    const [payRes, dashRes] = await Promise.all([fetchHostPayments(1500), fetchHostDashboard()]);
    if (!payRes) {
      setError("Could not load payments. Sign in as a host and ensure the API is running.");
      setPayments([]);
    } else {
      setError(null);
      setPayments(payRes.payments);
      setSummary(payRes.summary);
    }
    setDash(dashRes);
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const outstandingTotal = React.useMemo(
    () =>
      payments
        .filter((p) => p.status === "pending" || p.status === "overdue")
        .reduce((s, p) => s + parseAmount(p.amount), 0),
    [payments]
  );

  const filtered = React.useMemo(() => {
    let list = payments;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          String(p.id).includes(q) ||
          String(p.booking).includes(q) ||
          (p.customer ?? "").toLowerCase().includes(q) ||
          (p.property_title ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((p) => p.payment_type === typeFilter);
    return [...list].sort((a, b) => {
      const da = new Date(a.due_date).getTime();
      const db = new Date(b.due_date).getTime();
      return db - da;
    });
  }, [payments, search, statusFilter, typeFilter]);

  const PAGE_SIZE = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  React.useEffect(() => setPage(1), [search, statusFilter, typeFilter]);

  const exportCsv = () => {
    const headers = ["ID", "Booking", "Due", "Paid", "Property", "Tenant", "Type", "Amount", "Status", "Reference"];
    const rows = filtered.map((p) =>
      [
        p.id,
        p.booking,
        p.due_date,
        p.paid_date ?? "",
        p.property_title ?? "",
        p.customer ?? "",
        PAYMENT_TYPE_LABEL[p.payment_type] ?? p.payment_type,
        p.amount,
        p.status,
        p.transaction_id ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-payments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading payments…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-[var(--logo-muted)]/30 px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[var(--logo)]/5 blur-3xl" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80">
                <Landmark className="size-3.5 text-[var(--logo)]" />
                Rent schedule &amp; receipts
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Transactions
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                These lines are <strong className="font-medium text-slate-800">booking installments</strong> (security
                deposit + monthly rent) generated when tenants reserve your units. There is no in-app card checkout—use{" "}
                <strong className="font-medium text-slate-800">Record payment</strong> when money hits your account.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setBulkOpen(true)}
                  className="gap-2 border-0 bg-[var(--logo)] text-white shadow-md hover:bg-[var(--logo-hover)]"
                >
                  <Layers className="size-4" />
                  Record advance (bulk)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRefresh}
                  className="gap-2 border-slate-200 bg-white/90 shadow-sm hover:bg-white"
                >
                  <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>
              {dash?.revenue && (
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-right shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Last 30 days (dashboard)</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatDashboardCurrency(currency, dash.revenue.last_30_days)}
                  </p>
                  <p className="text-xs text-slate-500">Pending pipeline: {formatDashboardCurrency(currency, dash.revenue.upcoming)}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "In this list",
              value: summary.count,
              sub: "schedule rows loaded",
              icon: Wallet,
              tone: "text-slate-700",
              bg: "bg-slate-50 ring-slate-200/80",
            },
            {
              label: "Collected rows",
              value: summary.paid,
              sub: "marked paid",
              icon: CheckCircle2,
              tone: "text-emerald-700",
              bg: "bg-emerald-50 ring-emerald-200/60",
            },
            {
              label: "Awaiting",
              value: summary.pending + summary.overdue,
              sub: `${summary.pending} pending · ${summary.overdue} overdue`,
              icon: Clock,
              tone: "text-amber-800",
              bg: "bg-amber-50 ring-amber-200/60",
            },
            {
              label: "Outstanding amount",
              value: formatDashboardCurrency(currency, outstandingTotal),
              sub: "pending + overdue installments",
              icon: AlertTriangle,
              tone: "text-rose-800",
              bg: "bg-rose-50 ring-rose-200/50",
            },
          ].map((card, i) => (
            <div
              key={card.label}
              className={cn(
                "flex gap-4 rounded-2xl border border-white/60 p-5 ring-1 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                card.bg
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm", card.tone)}>
                <card.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{card.value}</p>
                <p className="mt-0.5 truncate text-xs text-slate-600">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold capitalize transition",
                    period === p
                      ? "bg-[var(--logo)] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <CollectedChart payments={payments} period={period} currency={currency} />
          </div>
          <div className="lg:col-span-3 flex flex-col justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
            <ArrowUpRight className="mb-2 size-5 text-[var(--logo)]" />
            <h3 className="text-base font-semibold text-slate-900">How this fits your workflow</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>Payments are created from the booking&apos;s payment schedule—not from app store purchases.</li>
              <li>Use <strong className="text-slate-800">Mark as paid</strong> after you verify the tenant&apos;s transfer.</li>
              <li>
                For <strong className="text-slate-800">6 / 12 / 24 months</strong> (or more) paid upfront, use{" "}
                <strong className="text-slate-800">Record advance (bulk)</strong> to mark many rent lines at once.
              </li>
              <li>Export CSV for accounting; references can store MoMo or bank transaction IDs.</li>
            </ul>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payment schedule</h2>
              <p className="text-xs text-slate-500">{filtered.length} row{filtered.length !== 1 ? "s" : ""} (filtered)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tenant, property, ID…"
                  className="w-52 rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15 sm:w-64"
                />
              </div>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterOpen((o) => !o)}
                  className={cn(
                    "gap-1.5 border-slate-200",
                    statusFilter !== "all" && "border-[var(--logo)]/40 bg-[var(--logo-muted)]"
                  )}
                >
                  <Filter className="size-3.5" />
                  Status
                </Button>
                {filterOpen ? (
                  <>
                    <button type="button" className="fixed inset-0 z-40 cursor-default" aria-hidden onClick={() => setFilterOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      {["all", "paid", "pending", "overdue", "cancelled", "refunded"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm capitalize",
                            statusFilter === s ? "bg-[var(--logo-muted)] font-medium text-[var(--logo)]" : "hover:bg-slate-50"
                          )}
                          onClick={() => {
                            setStatusFilter(s);
                            setFilterOpen(false);
                          }}
                        >
                          {s === "all" ? "All statuses" : s}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/15"
              >
                <option value="all">All types</option>
                <option value="rent">Rent</option>
                <option value="deposit">Deposit</option>
                <option value="late_fee">Late fee</option>
                <option value="utility">Utility</option>
                <option value="damage">Damage</option>
                <option value="refund">Refund</option>
              </select>
              <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 border-slate-200">
                <Download className="size-3.5" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 sm:px-6">ID</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right sm:px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageRows.map((p) => {
                  const canRecord = p.status === "pending" || p.status === "overdue";
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700 sm:px-6">
                        #{p.id}
                        <span className="mt-0.5 block font-sans text-[10px] text-slate-400">Booking {p.booking}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{format(new Date(p.due_date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-900">{p.property_title ?? "—"}</span>
                        {p.paid_date ? (
                          <span className="mt-0.5 block text-xs text-emerald-600">Paid {p.paid_date}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-semibold text-[var(--logo)]">
                            {(p.customer ?? "?").charAt(0).toUpperCase()}
                          </span>
                          {p.customer ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {PAYMENT_TYPE_LABEL[p.payment_type] ?? p.payment_type}
                          {p.month_number > 0 ? ` · M${p.month_number}` : null}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-900">
                        {formatDashboardCurrency(currency, p.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                            STATUS_STYLES[p.status] ?? "bg-slate-100 text-slate-700"
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-6">
                        {canRecord ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-[var(--logo)]/30 font-medium text-[var(--logo)] hover:bg-[var(--logo-muted)]"
                            onClick={() => setRecordPayment(p)}
                          >
                            Record payment
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {p.transaction_id ? `Ref: ${p.transaction_id}` : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">No payments match your filters.</p>
          ) : (
            <Pagination
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              currentPage={safePage}
              onPageChange={setPage}
              itemLabel="payments"
            />
          )}
        </div>
      </div>

      <RecordPaymentModal
        open={recordPayment != null}
        payment={recordPayment}
        onClose={() => setRecordPayment(null)}
        currency={currency}
        onDone={() => void load()}
      />

      <BulkAdvancePaymentModal
        open={bulkOpen}
        onClose={() => {
          clearBookingQueryParam();
          setBulkOpen(false);
        }}
        payments={payments}
        onDone={() => void load()}
        initialBookingId={bookingFromUrl}
      />
    </DashboardLayout>
  );
}
