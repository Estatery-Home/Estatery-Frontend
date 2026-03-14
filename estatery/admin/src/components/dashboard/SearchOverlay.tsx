"use client";

/**
 * Quick search overlay – search agents, sections, properties; keyboard nav.
 * Uses searchData.searchAll; navigates on select.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAll, type SearchResult } from "@/lib/searchData";
import { useProperties } from "@/contexts/PropertiesContext";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

export function SearchOverlay({ open, onClose, initialQuery = "" }: SearchOverlayProps) {
  const navigate = useNavigate();
  const { properties } = useProperties();
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const propertyList = React.useMemo(
    () => properties.map((p) => ({ id: p.id, title: p.title, address: p.address, city: p.city, country: p.country })),
    [properties]
  );
  const results = React.useMemo(() => searchAll(query, propertyList), [query, propertyList]);

  React.useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, initialQuery]);

  const hasQueryRow = query.trim().length > 0;
  const displayCount = (hasQueryRow ? 1 : 0) + results.length;

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el || selectedIndex < 0) return;
    const item = el.children[selectedIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, displayCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < displayCount - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : displayCount - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hasQueryRow && selectedIndex === 0) return;
      const r = results[hasQueryRow ? selectedIndex - 1 : selectedIndex];
      if (r?.href) {
        navigate(r.href);
        onClose();
      }
    }
  };

  const handleSelectResult = (r: SearchResult) => {
    if (r.href) navigate(r.href);
    onClose();
  };

  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Quick search"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[#e2e8f0] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-4 py-3">
          <Search className="size-5 shrink-0 text-[#64748b]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
            aria-label="Search"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
            Jump to
          </p>
          <div ref={listRef}>
            {hasQueryRow && (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                  selectedIndex === 0 ? "bg-[var(--logo-muted)] text-[var(--logo)]" : "text-[#1e293b] hover:bg-[#f8fafc]"
                )}
                onClick={() => inputRef.current?.focus()}
                onMouseEnter={() => setSelectedIndex(0)}
              >
                <span className="text-[#64748b]">Q</span>
                <span>&quot;{query.trim()}&quot;</span>
              </button>
            )}
            {results.map((r, i) => {
              const idx = (hasQueryRow ? 1 : 0) + i;
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    selectedIndex === idx ? "bg-[var(--logo-muted)] text-[var(--logo)]" : "text-[#1e293b] hover:bg-[#f8fafc]"
                  )}
                  onClick={() => handleSelectResult(r)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {r.avatar ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-medium text-[var(--logo)]">
                      {r.avatar}
                    </div>
                  ) : (
                    <div className="size-8 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.label}</p>
                    {r.subtitle && <p className="truncate text-xs text-[#64748b]">{r.subtitle}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-[#e2e8f0] px-4 py-2 text-xs text-[#64748b]">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Quit</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(overlay, document.body) : null;
}
