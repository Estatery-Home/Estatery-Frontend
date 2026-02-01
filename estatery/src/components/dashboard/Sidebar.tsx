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
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BRAND = "Luxeyline";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/agents", label: "Agents", icon: Users },
  { to: "/dashboard/clients", label: "Clients", icon: UserCircle },
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
  { to: "/dashboard/settings", label: "Setting", icon: Settings },
  { to: "/dashboard/help", label: "Help Center", icon: Headphones },
  { to: "/dashboard/feedback", label: "Feedback", icon: MessageCircle },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-[#e0f2fe] text-[#21438D]"
        : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
      isActive && "border-l-[3px] border-l-[#21438D] rounded-l-none pl-[calc(0.75rem+3px)]"
    );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[#e2e8f0] bg-[#f8fafc] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-[#e2e8f0] px-3">
        <Image src="/Logo.png" alt="" width={32} height={32} className="shrink-0 rounded-lg object-contain" />
        {!collapsed && <span className="truncate text-base font-bold text-[#1e293b]">{BRAND}</span>}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#e2e8f0] hover:text-[#1e293b]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("size-5 transition-transform duration-200", collapsed && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto p-2">
        {/* Main Menu */}
        {!collapsed && (
          <p className="mb-1.5 px-3 pt-1 text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
            Main Menu
          </p>
        )}
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/dashboard"}>
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Sales Chanel - no divider */}
        {!collapsed && (
          <p className="mb-1.5 mt-4 px-3 pt-1 text-xs font-medium uppercase tracking-wide text-[#94a3b8]">
            Sales Chanel
          </p>
        )}
        <div className="space-y-0.5">
          {salesNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Bottom section - pushed to bottom, no divider */}
        <div className="mt-auto space-y-0.5 pt-4">
          {bottomNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
