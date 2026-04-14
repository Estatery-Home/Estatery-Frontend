"use client";

/**
 * Top bar – search trigger, notifications, profile avatar.
 * Premium modernized dashboard styling.
 */
import * as React from "react";
import { Search, LayoutGrid, Bell, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";
import { NotificationsPanel } from "./NotificationsPanel";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { AddPropertyFab } from "./AddPropertyFab";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const { profile, updateProfile } = useUserProfile();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const profileRef = React.useRef<HTMLDivElement>(null);

  const handleLogoutConfirm = async () => {
    await logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      <header className="sticky top-0 z-30 flex h-[72px] w-full max-w-full shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white/90 pl-14 pr-3 sm:gap-4 sm:px-6 sm:pl-6 backdrop-blur-xl transition-all duration-300">
        {/* Search bar – clicking opens the SearchOverlay */}
        <button
          type="button"
          className={cn(
            "group flex min-w-0 w-full max-w-[min(100%,20rem)] flex-1 sm:max-w-md items-center gap-2 rounded-xl border bg-slate-50/50 px-3 py-1.5 transition-all duration-300 text-left outline-none",
            searchOpen ? "border-indigo-500 bg-white ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-sm"
          )}
          onClick={() => setSearchOpen(true)}
          aria-label="Quick search"
        >
          <Search className="size-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-500" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-400 group-hover:text-slate-500 transition-colors">Search everything...</span>
          <LayoutGrid className="size-3.5 shrink-0 text-slate-300" />
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 sm:inline-block shadow-sm">
            ⌘K
          </kbd>
        </button>

        {/* Right side: notifications bell + profile avatar */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative flex size-[38px] items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 outline-none focus:ring-4 focus:ring-slate-100"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
          
          <div className="h-6 w-px bg-slate-100" />
          
          {/* Profile Dropdown Container */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="group flex items-center gap-2.5 rounded-xl p-1 pr-3 transition-colors hover:bg-slate-50 focus:bg-slate-50 outline-none"
              aria-label="Open profile"
            >
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 shadow-sm transition-transform group-hover:scale-105 border border-indigo-100/50">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="hidden min-w-0 sm:flex flex-col items-start gap-0.5">
                <p className="truncate text-xs font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{profile.username}</p>
                <p className="truncate text-[10px] font-medium tracking-wide text-slate-400 uppercase">{profile.user_type}</p>
              </div>
            </button>

            {/* Profile Dropdown Card */}
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[280px] rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200 backdrop-blur-xl">
                {/* Header Profile Section */}
                <div className="flex items-center justify-between bg-slate-50/50 p-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <label className="relative flex size-[52px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-indigo-50 border border-indigo-100 text-xl font-black text-indigo-600 shadow-sm transition-transform hover:scale-105">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" className="size-full object-cover" />
                      ) : (
                        <span>{initial}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    <div className="min-w-0">
                      <span className="block truncate text-[15px] font-bold text-slate-900">{profile.username}</span>
                      <span className="block truncate text-xs font-medium text-slate-400">{profile.email || "user@estatery.com"}</span>
                    </div>
                  </div>
                </div>

                {/* List Actions */}
                <div className="flex flex-col p-2 space-y-0.5">
                  <button 
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings/settings");
                  }}  
                  className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-50 focus:bg-slate-50 active:scale-[0.98] outline-none">
                    <User className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
                    View Profile
                  </button>
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings/settings?section=my-account");
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-50 focus:bg-slate-50 active:scale-[0.98] outline-none"
                  >
                    <Settings className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
                    Account Settings
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-bold text-rose-500 transition-all hover:bg-rose-50 focus:bg-rose-50 active:scale-[0.98] outline-none"
                  >
                    <LogOut className="size-4 shrink-0 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                    Logout
                  </button>
                </div>
              </div>
            )}
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
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
      <AddPropertyFab />
    </>
  );
}
