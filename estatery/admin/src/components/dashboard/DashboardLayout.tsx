"use client";

/**
 * Layout wrapper for Settings and other dashboard-style pages.
 * Sidebar + TopBar + main content area, with logout confirmation.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "./index";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  /** Log out, close dialog, redirect to login */
  const handleLogoutConfirm = async () => {
    await logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#f1f5f9] font-sans text-[#1e293b] antialiased">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "min-w-0 max-w-full transition-[margin] duration-300 ease-in-out",
          sidebarCollapsed ? "ml-0 sm:ml-[80px]" : "ml-0 sm:ml-[260px]"
        )}
      >
        <TopBar />
        {/* Document scroll (body) — avoids nested scroll traps so trackpad / wheel work anywhere */}
        <main className="w-full max-w-full overflow-x-hidden break-words px-4 py-4 pb-10 sm:px-6 sm:py-6 sm:pb-12">
          {children}
        </main>
      </div>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
