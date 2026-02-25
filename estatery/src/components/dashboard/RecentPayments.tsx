"use client";

/**
 * Recent payments table – filter by status, sort, pagination.
 * Status change with confirmation modal; mock data.
 */
import * as React from "react";
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 8;

type Payment = {
  id: string;
  date: string;
  property: string;
  address: string;
  customer: string;
  type: string;
  amount: string;
  status: "Pending" | "Failed" | "Completed";
};

const INITIAL_PAYMENTS: Payment[] = [
  { id: "23487", date: "July 08, 2025", property: "Oak Grove Estates", address: "123 Oak St", customer: "David Martinez", type: "Rent", amount: "₵293.00", status: "Pending" },
  { id: "23488", date: "July 09, 2025", property: "Maple Heights", address: "456 Maple Ave", customer: "Sarah Johnson", type: "Rent", amount: "₵320.00", status: "Failed" },
  { id: "23489", date: "July 10, 2025", property: "Pine View", address: "789 Pine Rd", customer: "Mike Chen", type: "Sale", amount: "₵15,200.00", status: "Completed" },
  { id: "23490", date: "July 11, 2025", property: "Sunset Terrace", address: "321 Sunset Blvd", customer: "Emma Wilson", type: "Rent", amount: "₵450.00", status: "Pending" },
  { id: "23491", date: "July 12, 2025", property: "Lakeside Villa", address: "555 Lake Dr", customer: "James Brown", type: "Sale", amount: "₵8,500.00", status: "Completed" },
  { id: "23492", date: "July 13, 2025", property: "Urban Heights", address: "100 Main St", customer: "Anna Davis", type: "Rent", amount: "₵380.00", status: "Pending" },
  { id: "23493", date: "July 14, 2025", property: "Green Valley", address: "200 Valley Rd", customer: "Chris Lee", type: "Rent", amount: "₵520.00", status: "Completed" },
  { id: "23494", date: "July 15, 2025", property: "Harbor View", address: "77 Harbor St", customer: "Maria Garcia", type: "Sale", amount: "₵12,000.00", status: "Failed" },
  { id: "23495", date: "July 16, 2025", property: "Park Place", address: "88 Park Ave", customer: "Tom Anderson", type: "Rent", amount: "₵610.00", status: "Pending" },
  { id: "23496", date: "July 17, 2025", property: "Riverside", address: "33 River Ln", customer: "Lisa Moore", type: "Rent", amount: "₵295.00", status: "Completed" },
  { id: "23497", date: "July 18, 2025", property: "Hilltop Manor", address: "99 Hill Rd", customer: "Paul Clark", type: "Sale", amount: "₵9,200.00", status: "Pending" },
  { id: "23498", date: "July 19, 2025", property: "Downtown Loft", address: "44 Center St", customer: "Rachel Green", type: "Rent", amount: "₵720.00", status: "Completed" },
];

const STATUS_OPTIONS: Payment["status"][] = ["Pending", "Completed", "Failed"];

const statusClass: Record<string, string> = {
  Pending: "bg-[#fef9c3] text-[#a16207]",
  Failed: "bg-[#fee2e2] text-[#dc2626]",
  Completed: "bg-[#dcfce7] text-[#16a34a]",
};

const FILTER_OPTIONS = ["Filter", "Pending", "Failed", "Completed"] as const;
const SORT_BY_OPTIONS = ["All", "Rent", "Sale"] as const;

type ConfirmState = { paymentId: string; fromStatus: string; toStatus: string } | null;

export function RecentPayments() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("Filter");
  const [sortBy, setSortBy] = React.useState<string>("All");
  const [page, setPage] = React.useState(1);
  const [paymentsList, setPaymentsList] = React.useState<Payment[]>(() =>
    INITIAL_PAYMENTS.map((p) => ({ ...p }))
  );
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [confirmState, setConfirmState] = React.useState<ConfirmState>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const handleStatusChangeRequest = (payment: Payment, newStatus: Payment["status"]) => {
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
        p.id === confirmState.paymentId ? { ...p, status: confirmState.toStatus as Payment["status"] } : p
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
          p.id.includes(s) ||
          p.customer.toLowerCase().includes(s) ||
          p.property.toLowerCase().includes(s)
      );
    }
    if (filter !== "Filter") {
      result = result.filter((p) => p.status === filter);
    }
    if (sortBy !== "All") {
      result = result.filter((p) => p.type === sortBy);
    }
    result = [...result].sort((a, b) => a.type.localeCompare(b.type));
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
              <option key={opt} value={opt}>
                {opt}
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
              <option key={opt} value={opt}>
                {opt === "All" ? "Sort by" : opt}
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
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Property Info</th>
              <th className="pb-3 pr-4 font-medium">Customer Name</th>
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
                <td className="py-3 pr-4 text-[#64748b]">{p.date}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-[#1e293b]">{p.property}</p>
                  <p className="text-xs text-[#64748b]">{p.address}</p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-medium text-[var(--logo)]">
                      {p.customer.slice(0, 1)}
                    </div>
                    {p.customer}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-[var(--logo-muted)] px-2 py-0.5 text-xs font-medium text-[var(--logo)]">
                    {p.type}
                  </span>
                </td>
                <td className="py-3 pr-4 font-medium text-[#1e293b]">{p.amount}</td>
                <td className="py-3 pr-4">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
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
                        {STATUS_OPTIONS.filter((s) => s !== p.status).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChangeRequest(p, status)}
                            className="w-full px-3 py-2 text-left text-sm text-[#1e293b] hover:bg-[#f8fafc]"
                          >
                            Mark as {status}
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
              <span className="font-medium text-[#1e293b]">{confirmState.fromStatus}</span> to{" "}
              <span className="font-medium text-[#1e293b]">{confirmState.toStatus}</span>?
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
