"use client";

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
  TrendingUp,
  CircleDollarSign,
  Tag,
  Settings,
  Headphones,
  MessageCircle,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BRAND = "Luxeyline";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/agents", label: "Agents", icon: Users },
  { to: "/clients/clients", label: "Clients", icon: UserCircle },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const salesNav = [
  { to: "/dashboard/properties", label: "Properties", icon: Building2 },
  { to: "/dashboard/leads", label: "Leads", icon: TrendingUp },
  { to: "/dashboard/transactions", label: "Transactions", icon: CircleDollarSign },
  { to: "/dashboard/discounts", label: "Discounts", icon: Tag },
];

const bottomNav = [
  { to: "/settings/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/help", label: "Help Center", icon: Headphones },
  { to: "/dashboard/feedback", label: "Feedback", icon: MessageCircle }, 
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  /** Called when user clicks Logout. If provided, shows confirmation dialog instead of navigating. */
  onLogoutClick?: () => void;
};

export function Sidebar({ collapsed, onToggle, onLogoutClick }: SidebarProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex min-h-[36px] min-w-[36px] items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200",
      isActive
        ? "bg-[var(--logo-muted)] text-[#1976d2]"
        : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
      isActive && "border-l-2 border-l-[var(--logo)] rounded-l-none pl-[calc(0.625rem+2px)]"
    );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-[#f1f5f9] bg-[#f8fafc] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-11 items-center gap-2 border-b border-[#f1f5f9] px-2.5">
        <Image src="/logo.png" alt="" width={28} height={28} className="shrink-0 rounded object-contain" />
        {!collapsed && <span className="truncate text-sm font-semibold text-[#1e293b]">{BRAND}</span>}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-[#e2e8f0] hover:text-[#1e293b]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            <ChevronLeft
            className={cn("size-4 transition-transform duration-200", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto p-2">
        {/* Main Menu */}
        {!collapsed && (
          <p className="mb-1 px-2.5 pt-1 text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
            Main Menu
          </p>
        )}
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/dashboard"}>
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Sales Chanel */}
        {!collapsed && (
          <p className="mb-1 mt-3 px-2.5 pt-1 text-[10px] font-medium uppercase tracking-wide text-[#94a3b8]">
            Sales Chanel
          </p>
        )}
        <div className="space-y-0.5">
          {salesNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Bottom section - pushed to bottom, no divider */}
        <div className="mt-auto space-y-0.5 pt-4">
          {bottomNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
          {onLogoutClick && (
            <button
              type="button"
              onClick={onLogoutClick}
              className={cn(
                "relative flex min-h-[36px] w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200",
                "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
              )}
              aria-label="Logout"
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">Logout</span>}
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}
