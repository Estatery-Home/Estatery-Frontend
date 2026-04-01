"use client";

/**
 * Clients table – search, status filter, sort, pagination, row actions.
 * Premium modernized dashboard styling.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter as FilterIcon, ArrowUpDown, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clientsTableData, type ClientRow, type ClientStatus } from "@/lib/clients";

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
  const [clientsData, setClientsData] = React.useState<ClientRow[]>(() =>
    clientsTableData.map((c) => ({ ...c }))
  );
  const [selectedClient, setSelectedClient] = React.useState<ClientRow | null>(null);

  const filteredAndSorted = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = clientsData.slice();

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
  }, [search, statusFilter, sortField, sortDirection, clientsData]);

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

  const handleConfirmStatusChange = () => {
    if (!selectedClient) return;
    setClientsData((prev) =>
      prev.map((c) =>
        c.id === selectedClient.id
          ? {
              ...c,
              status:
                c.status === "On Going"
                  ? ("Completed" as ClientStatus)
                  : c.status === "Completed"
                    ? ("On Going" as ClientStatus)
                    : c.status === "Overdue"
                      ? ("Completed" as ClientStatus)
                      : c.status,
            }
          : c
      )
    );
    setSelectedClient(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-slate-900">Clients Ledger</h2>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative w-full sm:max-w-xs shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-xl border-slate-200 bg-white pl-9 pr-3 h-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500/20"
            />
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | ClientStatus)}
            >
              <SelectTrigger className="flex-1 sm:w-[130px] justify-between gap-2 h-10 rounded-xl border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-sm focus:ring-indigo-500/20">
              <div className="flex items-center gap-2">
                <FilterIcon className="size-3.5 text-slate-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-lg">
              <SelectItem value="all" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">All Status</SelectItem>
              <SelectItem value="On Going" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">On Going</SelectItem>
              <SelectItem value="Completed" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">Completed</SelectItem>
              <SelectItem value="Overdue" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">Overdue</SelectItem>
            </SelectContent>
          </Select>
            <Select value={sortField} onValueChange={handleSortChange}>
              <SelectTrigger className="flex-1 sm:w-[140px] justify-between gap-2 h-10 rounded-xl border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-sm focus:ring-indigo-500/20">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-3.5 text-slate-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-lg">
                <SelectItem value="name" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">Sort by Name</SelectItem>
                <SelectItem value="amount" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">Sort by Amount</SelectItem>
                <SelectItem value="nextPayment" className="text-[13px] font-medium text-slate-700 focus:bg-slate-50">Sort by Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-[0_1px_12px_rgba(0,0,0,0.02)]">
        <table className="min-w-[900px] w-full table-auto text-[13px]">
          <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3.5 text-left">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(value) => toggleAll(Boolean(value))}
                  className={cn(
                    "border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-md",
                    someChecked && "data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600"
                  )}
                  aria-label="Select all clients"
                />
              </th>
              <th className="px-4 py-3.5 text-left">Client ID</th>
              <th className="px-4 py-3.5 text-left">Client Name</th>
              <th className="px-4 py-3.5 text-left">Property Info</th>
              <th className="px-4 py-3.5 text-left">Type</th>
              <th className="px-4 py-3.5 text-right">Amount</th>
              <th className="px-4 py-3.5 text-left">Next Payment</th>
              <th className="px-4 py-3.5 text-left">Status</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((client) => {
              const checked = selectedIds.has(client.id);
              return (
                <tr
                  key={client.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3.5 align-middle">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleOne(client.id, Boolean(value))}
                      className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-md"
                      aria-label={`Select client ${client.name}`}
                    />
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => navigate(`/clients/${client.clientId}`)}
                      className="text-left font-medium text-slate-500 transition-colors hover:text-indigo-600"
                    >
                      {client.clientId}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => navigate(`/clients/${client.clientId}`)}
                      className="group flex items-center gap-3 text-left transition-colors"
                    >
                      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100/50 text-xs font-bold text-indigo-600 transition-transform group-hover:scale-105">
                        {client.avatarInitials}
                      </div>
                      <span className="font-bold text-slate-800 group-hover:text-indigo-600">{client.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 align-middle font-medium">
                    <div className="max-w-[180px]">
                      <p className="truncate text-slate-900">{client.propertyName}</p>
                      <p className="truncate text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{client.propertyAddress}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {client.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right align-middle text-[14px] font-bold tracking-tight text-slate-900">
                    {client.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-4 py-3.5 align-middle font-semibold text-slate-500">
                    {new Date(client.nextPayment).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        client.status === "On Going" &&
                          "bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-500/20",
                        client.status === "Completed" &&
                          "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20",
                        client.status === "Overdue" &&
                          "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20"
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedClient(client)}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200 outline-none"
                      aria-label={`More options for ${client.name}`}
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-16 text-center text-[13px] font-medium text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <FilterIcon className="size-10 text-slate-200" />
                    <p>No clients match your exact filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination matched to the global UI component scale */}
        <div className="border-t border-slate-100 bg-white/50 p-4 rounded-b-2xl">
          <Pagination
            totalItems={filteredAndSorted.length}
            pageSize={PAGE_SIZE}
            currentPage={safePage}
            onPageChange={setPage}
            itemLabel="clients"
          />
        </div>
      </div>

      {/* Client info card (modal) */}
      {selectedClient && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedClient(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-info-dialog-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2
                  id="client-info-dialog-title"
                  className="text-lg font-black tracking-tight text-slate-900"
                >
                  Client Overview
                </h2>
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100/50 shadow-sm">
                  {selectedClient.avatarInitials}
                </div>
              </div>
              
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <span className="font-semibold text-slate-400">Client ID</span>
                  <span className="font-bold text-slate-900">{selectedClient.clientId}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <span className="font-semibold text-slate-400">Name</span>
                  <span className="font-bold text-slate-900">{selectedClient.name}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5 items-start">
                  <span className="font-semibold text-slate-400 pt-0.5">Property</span>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{selectedClient.propertyName}</p>
                    <p className="max-w-[180px] truncate text-[10px] uppercase tracking-widest text-slate-400 mt-1">{selectedClient.propertyAddress}</p>
                  </div>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <span className="font-semibold text-slate-400">Type</span>
                  <span className="font-bold text-slate-900 flex items-center">{selectedClient.type}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <span className="font-semibold text-slate-400">Amount</span>
                  <span className="font-black text-[15px] tracking-tight text-slate-900 flex items-center">
                    {selectedClient.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-50 pb-2.5">
                  <span className="font-semibold text-slate-400">Next Payment</span>
                  <span className="font-bold text-slate-900 flex items-center">
                    {new Date(selectedClient.nextPayment).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5">
                  <span className="font-semibold text-slate-400">Status</span>
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                      selectedClient.status === "On Going" &&
                        "bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-500/20",
                      selectedClient.status === "Completed" &&
                        "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20",
                      selectedClient.status === "Overdue" &&
                        "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20"
                    )}
                  >
                    {selectedClient.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-center text-xs font-semibold text-slate-500 mb-4">
                  {selectedClient.status === "On Going" || selectedClient.status === "Overdue"
                    ? "Update this client's status to Completed?"
                    : "Revert this client's status to On Going?"}
                </p>
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedClient(null)}
                    className="flex-1 rounded-xl h-10 border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all outline-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmStatusChange}
                    className="flex-1 rounded-xl h-10 bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all outline-none"
                  >
                    Confirm Change
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
