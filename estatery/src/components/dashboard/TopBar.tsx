"use client";

/**
 * Top bar – search trigger, notifications, profile avatar.
 * Search and notifications open overlay/panel components.
 */
import * as React from "react";
import { Search, LayoutGrid, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";
import { NotificationsPanel } from "./NotificationsPanel";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function TopBar() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { profile, updateProfile } = useUserProfile();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        updateProfile({ avatar: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const initial = profile.username?.slice(0, 1)?.toUpperCase() || "U";

  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[#f1f5f9] bg-white px-3 transition-shadow duration-200 focus-within:shadow-sm">
        <button
          type="button"
          className={cn(
            "flex w-full max-w-xs sm:max-w-sm items-center gap-1.5 rounded-md border bg-[#f8fafc] px-2.5 py-1.5 transition-all duration-200 text-left",
            searchOpen ? "border-[var(--logo)] ring-2 ring-[var(--logo)]/20" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
          )}
          onClick={() => setSearchOpen(true)}
          aria-label="Quick search"
        >
          <Search className="size-3.5 shrink-0 text-[#64748b]" />
          <span className="min-w-0 flex-1 truncate text-xs text-[#94a3b8]">Quick search...</span>
          <LayoutGrid className="size-3.5 shrink-0 text-[#64748b]" />
          <kbd className="hidden rounded border border-[#e2e8f0] bg-white px-1 py-0.5 text-[10px] text-[#64748b] sm:inline-block">
            K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative flex size-8 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#1e293b]"
            aria-label="Notifications"
          >
            <Bell className="size-3.5" />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-[#ef4444]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-md pl-1.5 pr-1 py-0.5 transition-colors hover:bg-[#f1f5f9]"
            aria-label="Open profile"
          >
            <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-[var(--logo-muted)] text-xs font-medium text-[var(--logo)]">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="size-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="hidden min-w-0 sm:block text-left">
              <p className="truncate text-xs font-medium text-[#1e293b]">{profile.username}</p>
              <p className="truncate text-[10px] text-[#64748b] capitalize">{profile.user_type}</p>
            </div>
          </button>
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

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-[#1e293b]">Edit Profile</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--logo-muted)] text-lg font-semibold text-[var(--logo)]">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <p className="text-sm text-[#64748b]">Click below to upload a new profile picture.</p>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--logo)] px-4 py-2 text-xs font-medium text-white shadow-sm transition-transform transition-colors duration-150 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] active:scale-95">
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-full border border-[#e2e8f0] px-4 py-1.5 text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
