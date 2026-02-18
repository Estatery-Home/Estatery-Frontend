"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/properties";
import { Pagination } from "@/components/ui";

type PropertyListingTableProps = {
  properties: Property[];
};

export function PropertyListingTable({ properties }: PropertyListingTableProps) {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState("Last Updated");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return properties;
    const q = search.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.id.includes(q)
    );
  }, [properties, search]);

  const PAGE_SIZE = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageProps = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  React.useEffect(() => setPage(1), [search]);

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
          <Button
            variant="outline"
            size="sm"
            className="border-[#e2e8f0] text-[#1e293b] hover:bg-[#f8fafc]"
          >
            <Filter className="mr-1.5 size-4" />
            Filter
          </Button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1e293b] focus:border-[var(--logo)] focus:outline-none"
          >
            <option value="Last Updated">Sort by: Last Updated</option>
            <option value="Price">Price</option>
            <option value="Views">Views</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">
                <input
                  type="checkbox"
                  className="rounded border-[#e2e8f0]"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Property ID</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Property Info</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Type</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Price</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Status</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Views</th>
              <th className="px-4 py-3 font-medium text-[#64748b] sm:px-6">Last Updated</th>
              <th className="px-4 py-3 sm:px-6" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {pageProps.map((prop) => (
              <tr
                key={prop.id}
                className="border-b border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]"
              >
                <td className="px-4 py-3 sm:px-6">
                  <input
                    type="checkbox"
                    className="rounded border-[#e2e8f0]"
                    aria-label={`Select ${prop.name}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-[#1e293b] sm:px-6">{prop.id}</td>
                <td className="px-4 py-3 sm:px-6">
                  <Link
                    to={`/dashboard/properties/${prop.id}`}
                    className="flex items-center gap-3 hover:opacity-90"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9]">
                      <img src={prop.image} alt="" className="size-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1e293b] group-hover:text-[var(--logo)]">
                        {prop.name}
                      </p>
                      <p className="max-w-[180px] truncate text-xs text-[#64748b]">
                        {prop.location}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <span className="inline-flex rounded-md bg-[var(--logo-muted)] px-2 py-0.5 text-xs font-medium text-[var(--logo)]">
                    {prop.type ?? "Rent"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-[#1e293b] sm:px-6">{prop.price}</td>
                <td className="px-4 py-3 sm:px-6">
                  <span className="inline-flex rounded-md bg-[var(--logo-muted)] px-2 py-0.5 text-xs font-medium text-[var(--logo)]">
                    {prop.status ?? "Available"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#64748b] sm:px-6">{prop.views ?? "—"}</td>
                <td className="px-4 py-3 text-[#64748b] sm:px-6">{prop.lastUpdated ?? "—"}</td>
                <td className="px-4 py-3 sm:px-6">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        currentPage={safePage}
        onPageChange={setPage}
        itemLabel="properties"
      />
    </div>
  );
}
