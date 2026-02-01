"use client";

import * as React from "react";
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const payments = [
  {
    id: "23487",
    date: "July 08, 2025",
    property: "Oak Grove Estates",
    address: "123 Oak St",
    customer: "David Martinez",
    type: "Rent",
    amount: "$293.00",
    status: "Pending",
  },
  {
    id: "23488",
    date: "July 09, 2025",
    property: "Maple Heights",
    address: "456 Maple Ave",
    customer: "Sarah Johnson",
    type: "Rent",
    amount: "$320.00",
    status: "Failed",
  },
  {
    id: "23489",
    date: "July 10, 2025",
    property: "Pine View",
    address: "789 Pine Rd",
    customer: "Mike Chen",
    type: "Sale",
    amount: "$15,200.00",
    status: "Completed",
  },
];

const statusClass: Record<string, string> = {
  Pending: "bg-[#fef9c3] text-[#a16207]",
  Failed: "bg-[#fee2e2] text-[#dc2626]",
  Completed: "bg-[#dcfce7] text-[#16a34a]",
};

export function RecentPayments() {
  const [search, setSearch] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(true);

  const filtered = React.useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return payments;
    return payments.filter(
      (p) =>
        p.id.includes(s) ||
        p.customer.toLowerCase().includes(s) ||
        p.property.toLowerCase().includes(s)
    );
  }, [search]);

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
            className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#21438D] focus:outline-none focus:ring-2 focus:ring-[#21438D]/20"
            aria-label="Search payments"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
        >
          <Filter className="size-4" />
          Filter
        </button>
        <button
          type="button"
          onClick={() => setSortAsc((a) => !a)}
          className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b]"
        >
          <ArrowUpDown className="size-4" />
          Sort by
        </button>
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
            {filtered.map((p) => (
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
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-medium text-[#0369a1]">
                      {p.customer.slice(0, 1)}
                    </div>
                    {p.customer}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-md bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]">
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
                <td className="py-3">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
