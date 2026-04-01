"use client";

/**
 * Pagination – prev/next, page numbers with ellipsis.
 * Modern, premium look for dashboard tables.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaginationProps = {
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize?: number;
  /** Current page (1-based) */
  currentPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Optional label for the entity (e.g. "clients", "payments") */
  itemLabel?: string;
};

const DEFAULT_PAGE_SIZE = 10;

export function Pagination({
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  currentPage,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = totalItems === 0 ? 0 : endIndex;

  const goToPrev = () => onPageChange(Math.max(1, safePage - 1));
  const goToNext = () => onPageChange(Math.min(pageCount, safePage + 1));

  // Build page numbers with ellipsis
  const getPageNumbers = () => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [];
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, "ellipsis", pageCount);
    } else if (safePage >= pageCount - 3) {
      pages.push(1, "ellipsis", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount);
    } else {
      pages.push(1, "ellipsis", safePage - 1, safePage, safePage + 1, "ellipsis", pageCount);
    }
    return pages;
  };

  if (pageCount <= 1 && totalItems <= pageSize) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 mt-1">
        <p className="text-[13px] font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-1">
      <p className="text-[13px] font-medium text-slate-500">
        Showing{" "}
        <span className="font-bold text-slate-800">{showingFrom}</span>–
        <span className="font-bold text-slate-800">{showingTo}</span> of{" "}
        <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel}
      </p>
      
      <div className="flex items-center gap-1 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 shadow-sm">
        <button
          type="button"
          onClick={goToPrev}
          disabled={safePage === 1}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95",
            safePage === 1 && "cursor-not-allowed opacity-40 text-slate-400",
            safePage > 1 && "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4 shrink-0" />
        </button>
        
        <div className="flex items-center gap-0.5">
          {getPageNumbers().map((p, i) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs font-bold tracking-widest text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-[13px] transition-all duration-200 active:scale-95",
                  p === safePage
                    ? "bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20"
                    : "font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                )}
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>
        
        <button
          type="button"
          onClick={goToNext}
          disabled={safePage === pageCount}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95",
            safePage === pageCount && "cursor-not-allowed opacity-40 text-slate-400",
            safePage < pageCount && "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          )}
          aria-label="Next page"
        >
          <ChevronRight className="size-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
