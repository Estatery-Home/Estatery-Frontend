"use client";

/**
 * Recent payments table – API-aligned with BookingPayment shape.
 * Premium visualization with hover animations and modern table styling.
 */
import * as React from "react";
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn, formatGhanaCedi } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination"; 
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { markHostPaymentPaid } from "@/lib/api-client";
type LocalPaymentType = "deposit" | "rent" | "late_fee" | "utility" | "damage" | "refund" | string;
type LocalPaymentStatus = "pending" | "paid" | "overdue" | "refunded" | "cancelled" | string;

const PAGE_SIZE = 8;

export type PaymentDisplay = {
  id: number;
  booking: number;
  payment_type: LocalPaymentType;
  month_number: number;
  amount: string;
  due_date: string;
  status: LocalPaymentStatus;
  paid_date?: string | null;
  transaction_id?: string;
  property_title?: string;
  customer?: string;
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  rent: "Rent",
  late_fee: "Late Fee",
  utility: "Utility",
  damage: "Damage",
  refund: "Refund",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

const statusClass: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/60 shadow-amber-100",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-emerald-100",
  overdue: "bg-rose-50 text-rose-700 border-rose-200/60 shadow-rose-100",
  refunded: "bg-indigo-50 text-indigo-700 border-indigo-200/60 shadow-indigo-100",
  cancelled: "bg-slate-50 text-slate-700 border-slate-200/60 shadow-slate-100",
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

type ConfirmState = { paymentId: number; fromStatus: string; toStatus: string } | null;

export type RecentPaymentsProps = {
  payments: PaymentDisplay[];
  loading?: boolean;
  onRefetch?: () => void;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(amount: string) {
  return formatGhanaCedi(amount);
}

// Generate consistent vibrant colors from a string (for avatars)
function getAvatarColors(name: string) {
  const charCode = name.charCodeAt(0) || 65;
  const colors = [
    "from-violet-500 to-fuchsia-500",
    "from-blue-500 to-cyan-500",
    "from-rose-400 to-orange-400",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
  ];
  return colors[charCode % colors.length];
}

export function RecentPayments({ payments, loading, onRefetch }: RecentPaymentsProps) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("Filter");
  const [sortBy, setSortBy] = React.useState<string>("All");
  const [page, setPage] = React.useState(1);
  const [paymentsList, setPaymentsList] = React.useState<PaymentDisplay[]>(payments);
  const [savingId, setSavingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setPaymentsList(payments);
  }, [payments]);
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const handleStatusChangeRequest = (payment: PaymentDisplay, newStatus: string) => {
    setOpenMenuId(null);
    setConfirmState({
      paymentId: payment.id,
      fromStatus: payment.status,
      toStatus: newStatus,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmState) return;
    if (confirmState.toStatus === "paid") {
      setSavingId(confirmState.paymentId);
      const res = await markHostPaymentPaid(confirmState.paymentId);
      setSavingId(null);
      setConfirmState(null);
      if (!res.ok) {
        window.alert(res.message ?? "Could not update payment");
        return;
      }
      onRefetch?.();
      return;
    }
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative z-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Payments</h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {loading ? "Loading…" : "From your bookings (server)"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] group">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
            <input
              type="search"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all hover:bg-slate-100/50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              aria-label="Search payments"
            />
          </div>
          
          {/* Filter Dropdown */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-10 px-3.5 py-2 group relative flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 transition-all hover:bg-slate-100/50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 min-w-0">
                <Filter className="size-4 shrink-0 text-slate-400 group-focus:text-indigo-500" aria-hidden />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 z-[100]">
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem 
                  key={opt.value} 
                  value={opt.value} 
                  className="rounded-md font-medium text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer mx-1 my-0.5 px-3 py-2"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-10 px-3.5 py-2 group relative flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 transition-all hover:bg-slate-100/50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 min-w-0">
                <ArrowUpDown className="size-4 shrink-0 text-slate-400 group-focus:text-indigo-500" aria-hidden />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 z-[100]">
              {SORT_BY_OPTIONS.map((opt) => (
                <SelectItem 
                  key={opt.value} 
                  value={opt.value} 
                  className="rounded-md font-medium text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer mx-1 my-0.5 px-3 py-2"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="w-full min-w-[760px] text-sm text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
              <th className="py-3.5 pl-5 pr-2 w-10">
                <input type="checkbox" className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600/20 cursor-pointer" aria-label="Select all" />
              </th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Payment ID</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Property</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Customer</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Due Date</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Amount</th>
              <th className="py-3.5 px-3 font-semibold uppercase tracking-wider text-[11px]">Status</th>
              <th className="py-3.5 pr-4 pl-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60 bg-white">
            {pageRows.map((p) => {
              const avatarGradient = getAvatarColors(p.customer ?? "?");
              return (
                <tr
                  key={p.id}
                  className="group relative transition-all duration-200 hover:bg-slate-50/80 hover:shadow-[0_0_15px_rgba(0,0,0,0.02)]"
                >
                  <td className="py-3.5 pl-5 pr-2">
                    <input type="checkbox" className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600/20 cursor-pointer" aria-label={`Select ${p.id}`} />
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-700">#{p.id}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-semibold text-slate-900 truncate max-w-[160px]" title={p.property_title ?? "—"}>
                      {p.property_title ?? "—"}
                    </p>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr text-xs font-bold text-white shadow-sm ring-2 ring-white",
                        avatarGradient
                      )}>
                        {(p.customer ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{p.customer ?? "—"}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-500 whitespace-nowrap">
                    {formatDate(p.due_date)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex rounded-lg bg-slate-100 border border-slate-200/60 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {PAYMENT_TYPE_LABEL[p.payment_type] || p.payment_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {formatAmount(p.amount)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize shadow-sm",
                        statusClass[p.status] ?? "bg-slate-50 text-slate-700 border-slate-200/60"
                      )}
                    >
                      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-75" />
                      {p.status}
                    </span>
                  </td>
                  <td className="relative py-3.5 pr-5 pl-2">
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
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        aria-label="More options"
                        aria-expanded={openMenuId === p.id}
                      >
                        <MoreVertical className="size-4" />
                      </button>
                      
                      {openMenuId === p.id && (
                        <div
                          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] animate-in fade-in slide-in-from-top-1 rounded-xl border border-slate-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Update Status
                          </div>
                          <div className="space-y-0.5">
                            {STATUS_OPTIONS.filter((s) => s.value !== p.status).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleStatusChangeRequest(p, opt.value)}
                                className="w-full flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                Mark as {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="mx-auto flex max-w-[400px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-50">
                      <Search className="size-6 text-slate-400" />
                    </div>
                    <h3 className="mb-1 text-sm font-bold text-slate-900">No payments found</h3>
                    <p className="text-sm text-slate-500">
                      We couldn't find any payments matching your current filters. Try adjusting your search or clearing the filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-5">
        <Pagination
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          currentPage={safePage}
          onPageChange={setPage}
          itemLabel="payments"
        />
      </div>

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setConfirmState(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirm-title"
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-50">
                <ArrowUpDown className="size-6 text-indigo-600" />
              </div>
              <h2 id="status-confirm-title" className="text-xl font-bold text-slate-900">
                Update payment status?
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                You are about to change the payment status from{" "}
                <span className="inline-flex items-center rounded font-semibold text-slate-700 border border-slate-200 px-1 bg-slate-50 capitalize">{confirmState.fromStatus}</span> to{" "}
                <span className={cn("inline-flex items-center rounded font-bold px-1.5 capitalize", 
                  statusClass[confirmState.toStatus]?.replace("shadow-", "") // Reuse our status styles briefly here
                )}>{confirmState.toStatus}</span>.
              </p>
              <div className="mt-8 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmState(null)}
                  className="flex-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-transform"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleConfirmStatusChange()}
                  disabled={savingId != null}
                  className="flex-1 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {savingId != null ? "Saving…" : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
