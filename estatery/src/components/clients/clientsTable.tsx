"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter as FilterIcon, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { clientsTableData, type ClientStatus } from "@/lib/clients";

type SortField = "name" | "amount" | "nextPayment";

const PAGE_SIZE = 8;

export function ClientsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ClientStatus>("all");
  const [sortField, setSortField] = React.useState<SortField>("name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);

  const filteredAndSorted = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = clientsTableData.slice();

    if (term) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.propertyName.toLowerCase().includes(term) ||
          c.propertyAddress.toLowerCase().includes(term) ||
          c.clientId.includes(term)
      );
    }

    if (statusFilter !== "all") {
      rows = rows.filter((c) => c.status === statusFilter);
    }

    rows.sort((a, b) => {
      let comp = 0;
      if (sortField === "name") {
        comp = a.name.localeCompare(b.name);
      } else if (sortField === "amount") {
        comp = a.amount - b.amount;
      } else if (sortField === "nextPayment") {
        comp = a.nextPayment.localeCompare(b.nextPayment);
      }
      return sortDirection === "asc" ? comp : -comp;
    });

    return rows;
  }, [search, statusFilter, sortField, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const pageRows = filteredAndSorted.slice(startIndex, endIndex);

  // Reset to first page when filters/search/sort change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortField, sortDirection]);

  const allChecked = pageRows.length > 0 && pageRows.every((c) => selectedIds.has(c.id));
  const someChecked = pageRows.some((c) => selectedIds.has(c.id)) && !allChecked;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((c) => next.add(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((c) => next.delete(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSortChange = (value: string) => {
    if (value === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(value as SortField);
      setSortDirection("asc");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#1e293b]">Clients Table</h2>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full border-[#e2e8f0] bg-white pl-9 pr-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8]"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | ClientStatus)}
          >
            <SelectTrigger className="w-[110px] justify-center gap-2 rounded-full border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#1e293b]">
              <FilterIcon className="size-4 text-[#64748b]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="On Going">On Going</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortField} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[120px] justify-center gap-2 rounded-full border-[#e2e8f0] bg-white px-3 py-2 text-xs font-medium text-[#1e293b]">
              <ArrowUpDown className="size-4 text-[#64748b]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Client Name</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="nextPayment">Next Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
        <table className="min-w-[900px] w-full table-auto text-sm">
          <thead className="bg-[#f8fafc] text-xs font-medium uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(value) => toggleAll(Boolean(value))}
                  className={cn(
                    "border-[#cbd5e1]",
                    someChecked && "data-[state=indeterminate]:bg-[var(--logo-muted)]"
                  )}
                  aria-label="Select all clients"
                />
              </th>
              <th className="px-4 py-3 text-left">Client ID</th>
              <th className="px-4 py-3 text-left">Client Name</th>
              <th className="px-4 py-3 text-left">Property Info</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Next Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((client) => {
              const checked = selectedIds.has(client.id);
              return (
                <tr
                  key={client.id}
                  className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"
                >
                  <td className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleOne(client.id, Boolean(value))}
                      className="border-[#cbd5e1]"
                      aria-label={`Select client ${client.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-[#0f172a]">
                    <button
                      type="button"
                      onClick={() => navigate(`/clients/${client.clientId}`)}
                      className="text-left text-[#0f172a] hover:text-[var(--logo)]"
                    >
                      {client.clientId}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => navigate(`/clients/${client.clientId}`)}
                      className="flex items-center gap-3 text-left hover:text-[var(--logo)]"
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-semibold text-[var(--logo)]">
                        {client.avatarInitials}
                      </div>
                      <span className="text-[#0f172a]">{client.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="max-w-xs">
                      <p className="truncate text-[#0f172a]">{client.propertyName}</p>
                      <p className="truncate text-xs text-[#64748b]">{client.propertyAddress}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-0.5 text-xs font-medium text-[#1d4ed8]">
                      {client.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right align-middle text-[#0f172a]">
                    {client.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 align-middle text-[#0f172a]">
                    {new Date(client.nextPayment).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-0.5 text-xs font-medium",
                        client.status === "On Going" &&
                          "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
                        client.status === "Completed" &&
                          "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]",
                        client.status === "Overdue" &&
                          "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right text-lg text-[#94a3b8]">
                    ···
                  </td>
                </tr>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-[#94a3b8]"
                >
                  No clients match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          totalItems={filteredAndSorted.length}
          pageSize={PAGE_SIZE}
          currentPage={safePage}
          onPageChange={setPage}
          itemLabel="clients"
        />
      </div>
    </section>
  );
}

