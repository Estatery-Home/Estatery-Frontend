"use client";

/**
 * Property listing table – search, sort, filter, pagination.
 * Links to property detail; receives properties from parent.
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/properties";
import type { PropertyTypeApi, PropertyStatusApi } from "@/lib/api-types";
import {
  getPropertyLocation,
  getPropertyImage,
  getPropertyPriceDisplay,
  getRentalPeriodLabel,
  getPropertyStatusDisplay,
} from "@/lib/properties";
import { Pagination } from "@/components/ui";
import { cn } from "@/lib/utils";

type PropertyListingTableProps = {
  properties: Property[];
};

function parseLastUpdated(s: string | undefined): number {
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function parsePrice(price: string): number {
  const num = price.replace(/[^0-9.]/g, "");
  return parseFloat(num) || 0;
}

export function PropertyListingTable({ properties }: PropertyListingTableProps) {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("Last Updated");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState<"all" | PropertyTypeApi>("all");
  const [filterStatus, setFilterStatus] = React.useState<"all" | PropertyStatusApi>("all");

  const filtered = React.useMemo(() => {
    let result = properties;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          getPropertyLocation(p).toLowerCase().includes(q) ||
          String(p.id).includes(q)
      );
    }
    if (filterType !== "all") {
      result = result.filter((p) => p.property_type === filterType);
    }
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    return result;
  }, [properties, search, filterType, filterStatus]);

  const sorted = React.useMemo(() => {
    const arr = filtered.slice();
    const mult = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy === "Last Updated") {
        return mult * (parseLastUpdated(a.updated_at) - parseLastUpdated(b.updated_at));
      }
      if (sortBy === "Price") {
        return mult * (parsePrice(a.monthly_price) - parsePrice(b.monthly_price));
      }
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(v);
      setSortDir(v === "Last Updated" ? "desc" : "asc");
    }
  };

  const PAGE_SIZE = 8;
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageProps = sorted.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [search, filterType, filterStatus]);

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold text-[#1e293b]">Property Listing</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 rounded-lg border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20 sm:w-48"
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen((o) => !o)}
              className={cn(
                "border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]",
                (filterType !== "all" || filterStatus !== "all") && "border-[var(--logo)] bg-[var(--logo-muted)]"
              )}
            >
              <Filter className="mr-1.5 size-4" />
              Filter
              {(filterType !== "all" || filterStatus !== "all") && (
                <span className="ml-1 size-1.5 rounded-full bg-[var(--logo)]" />
              )}
            </Button>
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-lg">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "apartment", "house", "condo", "villa", "studio"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilterType(opt)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm",
                          filterType === opt
                            ? "bg-[var(--logo)] text-white"
                            : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                        )}
                      >
                        {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "available", "rented", "maintenance"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilterStatus(opt)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm",
                          filterStatus === opt
                            ? "bg-[var(--logo)] text-white"
                            : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                        )}
                      >
                        {opt === "all" ? "All" : getPropertyStatusDisplay(opt)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
          >
            <option value="Last Updated">Sort by: Last Updated</option>
            <option value="Price">Sort by: Price</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-3 py-3 font-medium text-[#64748b] sm:px-4">
                <input
                  type="checkbox"
                  className="rounded border-[#e2e8f0]"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Property ID</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Property Info</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Type</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Price</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Rental Period</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Status</th>
              <th className="px-3 py-2 font-medium text-[#64748b] sm:px-4">Last Updated</th>
              <th className="px-3 py-2 sm:px-4" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {pageProps.map((prop) => (
              <tr
                key={prop.id}
                className="border-b border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]"
              >
                <td className="px-3 py-2 sm:px-4">
                  <input
                    type="checkbox"
                    className="rounded border-[#e2e8f0]"
                    aria-label={`Select ${prop.title}`}
                  />
                </td>
                <td className="px-3 py-2 font-medium text-[#1e293b] sm:px-4">{prop.id}</td>
                <td className="px-3 py-2 sm:px-4">
                  <Link
                    to={`/dashboard/properties/${prop.id}`}
                    className="flex items-center gap-2 hover:opacity-90"
                  >
                    <div className="size-9 shrink-0 overflow-hidden rounded-md bg-[#f1f5f9]">
                      <img src={getPropertyImage(prop)} alt="" className="size-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1e293b] group-hover:text-[var(--logo)]">
                        {prop.title}
                      </p>
                      <p className="max-w-[180px] truncate text-[10px] text-[#64748b]">
                        {getPropertyLocation(prop)}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 sm:px-4">
                  <span className="inline-flex rounded bg-[var(--logo-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--logo)] capitalize">
                    {prop.property_type}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-[#1e293b] sm:px-4">{getPropertyPriceDisplay(prop)}</td>
                <td className="px-3 py-2 text-[#64748b] sm:px-4">{getRentalPeriodLabel(prop)}</td>
                <td className="px-3 py-2 sm:px-4">
                  <span className="inline-flex rounded bg-[var(--logo-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--logo)]">
                    {getPropertyStatusDisplay(prop.status)}
                  </span>
                </td>
                <td className="px-3 py-2 text-[#64748b] sm:px-4">
                  {prop.updated_at ? new Date(prop.updated_at).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="px-3 py-2 sm:px-4">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        totalItems={sorted.length}
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        onPageChange={setPage}
        itemLabel="properties"
      />
    </div>
  );
}
