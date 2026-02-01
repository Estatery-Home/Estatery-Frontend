"use client";

import * as React from "react";
import { Search, LayoutGrid, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";
import { NotificationsPanel } from "./NotificationsPanel";

type TopBarProps = {
  sidebarCollapsed?: boolean;
  user?: { name: string; role: string; avatar?: string };
};

export function TopBar({ user = { name: "Sarah Lee", role: "Agent" } }: TopBarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[#e2e8f0] bg-white px-4 transition-shadow duration-200 focus-within:shadow-sm">
        <button
          type="button"
          className={cn(
            "flex w-full max-w-xs sm:max-w-sm items-center gap-2 rounded-lg border bg-[#f8fafc] px-3 py-2 transition-all duration-200 text-left",
            searchOpen ? "border-[#21438D] ring-2 ring-[#21438D]/20" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
          )}
          onClick={() => setSearchOpen(true)}
          aria-label="Quick search"
        >
          <Search className="size-4 shrink-0 text-[#64748b]" />
          <span className="min-w-0 flex-1 truncate text-sm text-[#94a3b8]">Quick search...</span>
          <LayoutGrid className="size-4 shrink-0 text-[#64748b]" />
          <kbd className="hidden rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-xs text-[#64748b] sm:inline-block">
            K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative flex size-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-[#ef4444]" aria-hidden />
          </button>
          <div className="flex items-center gap-3 rounded-lg pl-2">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[#e0f2fe] text-sm font-medium text-[#0369a1]">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="size-full object-cover" />
            ) : (
              <span>{user.name.slice(0, 1)}</span>
            )}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium text-[#1e293b]">{user.name}</p>
            <p className="truncate text-xs text-[#64748b]">{user.role}</p>
          </div>
          </div>
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
