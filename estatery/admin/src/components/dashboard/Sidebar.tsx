"use client";

/**
 * Main navigation sidebar – collapsible, responsive.
 * Premium modernized dashboard styling.
 */
import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  BarChart3,
  Calendar,
  MessageSquare,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  Tag,
  Settings,
  Headphones,
  MessageCircle,
  ChevronLeft,
  LogOut,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const BRAND = "Home";

/** Primary nav items: Dashboard, Agents, Clients, Analytics, Calendar, Messages */
const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients/clients", label: "Clients", icon: UserCircle },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const salesNav = [
  { to: "/dashboard/properties", label: "Properties", icon: Building2 },
  { to: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/dashboard/transactions", label: "Transactions", icon: CircleDollarSign },
  { to: "/dashboard/discounts", label: "Discounts", icon: Tag },
];

/** Bottom nav: Settings, Help Center, Feedback */
const bottomNav = [
  { to: "/settings/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help Center", icon: Headphones },
  { to: "/dashboard/feedback", label: "Feedback", icon: MessageCircle }, 
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onLogoutClick?: () => void;
};

export function Sidebar({ collapsed, onToggle, onLogoutClick }: SidebarProps) {
  const isMobile = useIsMobile();

  const closeMobileDrawer = React.useCallback(() => {
    if (isMobile && !collapsed) onToggle();
  }, [isMobile, collapsed, onToggle]);

  /** Returns className for NavLink based on active state – minimal pill style */
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group relative flex items-center rounded-xl transition-all duration-300 ease-out outline-none",
      collapsed ? "justify-center size-10 mx-auto" : "min-h-[38px] w-full gap-3 px-3 py-1.5",
      "text-xs font-semibold",
      isActive
        ? "bg-[var(--logo)] text-white shadow-md shadow-[var(--logo)]/20"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
    );

  return (
    <>
      {/* Mobile Hamburger Button - Appears strictly on small screens when Sidebar is collapsed to allow users to toggle it */}
      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          className="sm:hidden fixed left-4 top-[18px] z-50 flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          aria-label="Open Mobile Menu"
        >
          <Menu className="size-5" />
        </button>
      )}

      {/* Mobile Backdrop Overlay - Provides focus on the sliding sidebar menu */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm animate-in fade-in transition-all sm:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-[60] flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out sm:h-screen sm:max-h-none",
          collapsed
            ? "pointer-events-none w-0 overflow-hidden border-none opacity-0 sm:pointer-events-auto sm:overflow-visible sm:border-solid sm:border-r sm:opacity-100 sm:w-[80px]"
            : "pointer-events-auto w-[min(260px,100vw)] opacity-100 max-sm:shadow-2xl sm:w-[260px]"
        )}
      >
      {/* Header Logo Area */}
      <div className={cn("flex h-[72px] w-full shrink-0 items-center transition-all relative z-50", collapsed ? "justify-center px-0" : "justify-start px-5")}>
        <div className="flex items-center gap-3 transition-all duration-300">
          <div className={cn("flex shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-all duration-300 hover:scale-105 hover:rotate-2", collapsed ? "size-9" : "size-[42px]")}>
            {/* Logo image that reduces padding to look correctly scaled when container shrinks */}
            <Image src="/images/HomeLogo.webp" alt="Home" width={50} height={50} className={cn("object-contain transition-all duration-300", collapsed ? "p-1.5" : "p-2")} />
          </div>
          {/* Brand text vanishes smoothly when collapsed */}
          {!collapsed && <span className="truncate text-xl font-extrabold tracking-tight text-slate-900 animate-in fade-in duration-300">{BRAND}</span>}
        </div>
        
        {/* Floating Toggle Button - Sits half-outside the sidebar border natively for premium interaction */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -right-3.5 hidden size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-500 hover:text-indigo-600 active:scale-95 sm:flex"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("size-3.5 transition-transform duration-300", collapsed && "rotate-180")}
            strokeWidth={2.5}
          />
        </button>
      </div>

      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain py-4 [-webkit-overflow-scrolling:touch] custom-scrollbar",
          collapsed ? "px-2" : "px-4"
        )}
      >
        {/* Main Menu */}
        <div className="mb-5">
          {!collapsed ? (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Main Menu
            </p>
          ) : (
            <div className="mx-auto mb-3 h-px w-6 bg-slate-100" />
          )}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.to === "/dashboard"}
                onClick={closeMobileDrawer}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("size-4 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
                    {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Sales Channel */}
        <div className="mb-5">
          {!collapsed ? (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Sales Channel
            </p>
          ) : (
            <div className="mx-auto mb-3 h-px w-6 bg-slate-100" />
          )}
          <div className="space-y-1">
            {salesNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={closeMobileDrawer}>
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("size-4 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
                    {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="mt-auto space-y-1 pt-6 border-t border-slate-100/60 pb-2">
          {bottomNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={closeMobileDrawer}>
              {({ isActive }) => (
                <>
                  <item.icon className={cn("size-4 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={isActive ? 2.5 : 2} />
                  {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
          {onLogoutClick && (
            <button
              type="button"
              onClick={() => {
                closeMobileDrawer();
                onLogoutClick?.();
              }}
              className={cn(
                "group relative flex items-center rounded-xl transition-all duration-300 ease-out hover:bg-rose-50 active:scale-[0.98] outline-none",
                collapsed ? "justify-center size-10 mx-auto" : "min-h-[38px] w-full gap-3 px-3 py-1.5",
                "text-xs font-semibold text-rose-500"
              )}
              aria-label="Logout"
            >
              <LogOut className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-1" strokeWidth={2} />
              {!collapsed && <span className="truncate tracking-wide">Logout</span>}
            </button>
          )}
        </div>
      </nav>
    </aside>
    </>
  );
}
