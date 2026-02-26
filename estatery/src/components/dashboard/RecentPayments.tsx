"use client";

/**
 * Recent payments table – API-aligned with BookingPayment shape.
 * payment_type: deposit | rent | late_fee | utility | damage | refund
 * status: pending | paid | overdue | refunded | cancelled
 * Display fields property_title, customer come from booking in API.
 */
import * as React from "react";
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { PaymentTypeApi, PaymentStatusApi } from "@/lib/api-types";

const PAGE_SIZE = 8;

/** API BookingPayment + display fields from booking (property_title, customer) */
type PaymentDisplay = {
  id: number;
  booking: number;
  payment_type: PaymentTypeApi;
  month_number: number;
  amount: string;
  due_date: string;
  status: PaymentStatusApi;
  paid_date?: string | null;
  transaction_id?: string;
  /** From booking – for display */
  property_title?: string;
  customer?: string;
};

const PAYMENT_TYPE_LABEL: Record<PaymentTypeApi, string> = {
  deposit: "Deposit",
  rent: "Rent",
  late_fee: "Late Fee",
  utility: "Utility",
  damage: "Damage",
  refund: "Refund",
};

const INITIAL_PAYMENTS: PaymentDisplay[] = [
  { id: 23487, booking: 101, payment_type: "rent", month_number: 1, amount: "293.00", due_date: "2025-07-08", status: "pending", property_title: "Oak Grove Estates", customer: "David Martinez" },
  { id: 23488, booking: 102, payment_type: "rent", month_number: 2, amount: "320.00", due_date: "2025-07-09", status: "cancelled", property_title: "Maple Heights", customer: "Sarah Johnson" },
  { id: 23489, booking: 103, payment_type: "deposit", month_number: 0, amount: "15200.00", due_date: "2025-07-10", status: "paid", property_title: "Pine View", customer: "Mike Chen" },
  { id: 23490, booking: 104, payment_type: "rent", month_number: 1, amount: "450.00", due_date: "2025-07-11", status: "pending", property_title: "Sunset Terrace", customer: "Emma Wilson" },
  { id: 23491, booking: 105, payment_type: "deposit", month_number: 0, amount: "8500.00", due_date: "2025-07-12", status: "paid", property_title: "Lakeside Villa", customer: "James Brown" },
  { id: 23492, booking: 106, payment_type: "rent", month_number: 3, amount: "380.00", due_date: "2025-07-13", status: "pending", property_title: "Urban Heights", customer: "Anna Davis" },
  { id: 23493, booking: 107, payment_type: "rent", month_number: 2, amount: "520.00", due_date: "2025-07-14", status: "paid", property_title: "Green Valley", customer: "Chris Lee" },
  { id: 23494, booking: 108, payment_type: "deposit", month_number: 0, amount: "12000.00", due_date: "2025-07-15", status: "cancelled", property_title: "Harbor View", customer: "Maria Garcia" },
  { id: 23495, booking: 109, payment_type: "rent", month_number: 1, amount: "610.00", due_date: "2025-07-16", status: "pending", property_title: "Park Place", customer: "Tom Anderson" },
  { id: 23496, booking: 110, payment_type: "rent", month_number: 4, amount: "295.00", due_date: "2025-07-17", status: "paid", property_title: "Riverside", customer: "Lisa Moore" },
  { id: 23497, booking: 111, payment_type: "deposit", month_number: 0, amount: "9200.00", due_date: "2025-07-18", status: "pending", property_title: "Hilltop Manor", customer: "Paul Clark" },
  { id: 23498, booking: 112, payment_type: "rent", month_number: 2, amount: "720.00", due_date: "2025-07-19", status: "paid", property_title: "Downtown Loft", customer: "Rachel Green" },
];

const STATUS_OPTIONS: { value: PaymentStatusApi; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

const statusClass: Record<PaymentStatusApi, string> = {
  pending: "bg-[#fef9c3] text-[#a16207]",
  paid: "bg-[#dcfce7] text-[#16a34a]",
  overdue: "bg-[#fee2e2] text-[#dc2626]",
  refunded: "bg-[#e0e7ff] text-[#4f46e5]",
  cancelled: "bg-[#fee2e2] text-[#dc2626]",
};

const FILTER_OPTIONS = [
  { value: "Filter", label: "Filter" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const SORT_BY_OPTIONS = [
  { value: "All", label: "Sort by" },
  { value: "rent", label: "Rent" },
  { value: "deposit", label: "Deposit" },
  { value: "late_fee", label: "Late Fee" },
] as const;

type ConfirmState = { paymentId: number; fromStatus: PaymentStatusApi; toStatus: PaymentStatusApi } | null;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatAmount(amount: string) {
  return `₵${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function RecentPayments() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("Filter");
  const [sortBy, setSortBy] = React.useState<string>("All");
  const [page, setPage] = React.useState(1);
  const [paymentsList, setPaymentsList] = React.useState<PaymentDisplay[]>(() =>
    INITIAL_PAYMENTS.map((p) => ({ ...p }))
  );
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const handleStatusChangeRequest = (payment: PaymentDisplay, newStatus: PaymentStatusApi) => {
    setOpenMenuId(null);
    setConfirmState({
      paymentId: payment.id,
      fromStatus: payment.status,
      toStatus: newStatus,
    });
  };

  const handleConfirmStatusChange = () => {
    if (!confirmState) return;
    setPaymentsList((prev) =>
      prev.map((p) =>
        p.id === confirmState.paymentId ? { ...p, status: confirmState.toStatus } : p
      )
    );
    setConfirmState(null);
  };

  const filtered = React.useMemo(() => {
    let result = paymentsList;
    const s = search.toLowerCase();
    if (s) {
      result = result.filter(
        (p) =>
          String(p.id).includes(s) ||
          (p.customer && p.customer.toLowerCase().includes(s)) ||
          (p.property_title && p.property_title.toLowerCase().includes(s))
      );
    }
    if (filter !== "Filter") {
      result = result.filter((p) => p.status === filter);
    }
    if (sortBy !== "All") {
      result = result.filter((p) => p.payment_type === sortBy);
    }
    result = [...result].sort((a, b) => a.payment_type.localeCompare(b.payment_type));
    return result;
  }, [search, filter, sortBy, paymentsList]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  React.useEffect(() => setPage(1), [search, filter, sortBy]);

  React.useEffect(() => {
    if (!openMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuId]);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-[#1e293b]">Recent Payments</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            aria-label="Search payments"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
          <Filter className="size-4 shrink-0 text-[#64748b]" aria-hidden />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-[100px] border-none bg-transparent text-sm text-[#1e293b] focus:outline-none focus:ring-0"
            aria-label="Filter by status"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
          <ArrowUpDown className="size-4 shrink-0 text-[#64748b]" aria-hidden />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-w-[90px] border-none bg-transparent text-sm text-[#1e293b] focus:outline-none focus:ring-0"
            aria-label="Sort by type"
          >
            {SORT_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] text-left text-[#64748b]">
              <th className="pb-3 pr-4">
                <input type="checkbox" className="rounded border-[#cbd5e1]" aria-label="Select all" />
              </th>
              <th className="pb-3 pr-4 font-medium">Payment ID</th>
              <th className="pb-3 pr-4 font-medium">Due Date</th>
              <th className="pb-3 pr-4 font-medium">Property</th>
              <th className="pb-3 pr-4 font-medium">Customer</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Amount</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]"
              >
                <td className="py-3 pr-4">
                  <input type="checkbox" className="rounded border-[#cbd5e1]" aria-label={`Select ${p.id}`} />
                </td>
                <td className="py-3 pr-4 font-medium text-[#1e293b]">{p.id}</td>
                <td className="py-3 pr-4 text-[#64748b]">{formatDate(p.due_date)}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-[#1e293b]">{p.property_title ?? "—"}</p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-medium text-[var(--logo)]">
                      {(p.customer ?? "?").slice(0, 1)}
                    </div>
                    {p.customer ?? "—"}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-[var(--logo-muted)] px-2 py-0.5 text-xs font-medium text-[var(--logo)]">
                    {PAYMENT_TYPE_LABEL[p.payment_type]}
                  </span>
                </td>
                <td className="py-3 pr-4 font-medium text-[#1e293b]">{formatAmount(p.amount)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                      statusClass[p.status] ?? "bg-[#f1f5f9] text-[#64748b]"
                    )}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="relative py-3">
                  <div
                    ref={openMenuId === p.id ? (el) => { menuRef.current = el; } : undefined}
                    className="relative inline-flex"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === p.id ? null : p.id));
                      }}
                      className="flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                      aria-label="More options"
                      aria-expanded={openMenuId === p.id}
                    >
                      <MoreVertical className="size-4" />
                    </button>
                    {openMenuId === p.id && (
                      <div
                        className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUS_OPTIONS.filter((s) => s.value !== p.status).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChangeRequest(p, opt.value)}
                            className="w-full px-3 py-2 text-left text-sm text-[#1e293b] hover:bg-[#f8fafc]"
                          >
                            Mark as {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-sm text-[#94a3b8]">
                          No payments match your search.
                        </td>
                      </tr>
                    )}
          </tbody>
        </table>
      </div>
      <Pagination
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        onPageChange={setPage}
        itemLabel="payments"
      />

      {confirmState && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setConfirmState(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirm-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
          >
            <h2 id="status-confirm-title" className="text-lg font-semibold text-[#1e293b]">
              Change status
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Are you sure you want to change{" "}
              <span className="font-medium text-[#1e293b] capitalize">{confirmState.fromStatus}</span> to{" "}
              <span className="font-medium text-[#1e293b] capitalize">{confirmState.toStatus}</span>?
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmState(null)}
                className="flex-1 rounded-lg border-[#e2e8f0] hover:bg-[#f8fafc]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmStatusChange}
                className="flex-1 rounded-lg bg-[var(--logo)] text-white hover:opacity-90"
              >
                Confirm
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
