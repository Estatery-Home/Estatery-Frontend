"use client";

/**
 * Clients – cards overview, table with export/refresh.
 * Uses lib/clients mock data; lastUpdated in localStorage.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { ClientsCards } from "@/components/clients/ClientsCards";
import { ClientsTable } from "@/components/clients/clientsTable";
import { clientsTableData } from "@/lib/clients";

export default function Clients() {
  const STORAGE_KEY = "clients-last-updated";
  const defaultLastUpdated = "July 08, 2025";

  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    }
    return defaultLastUpdated;
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  /* Update lastUpdated, persist to localStorage, show loading briefly */
  const handleRefresh = () => {
    setRefreshing(true);
    const now = new Date();
    const formatted = now.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setTimeout(() => {
      setLastUpdated(formatted);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, formatted);
      }
      setRefreshing(false);
    }, 800);
  };

  /* Build CSV from clients, trigger download */
  const handleExport = () => {
    const header = [
      "Client ID",
      "Client Name",
      "Property Name",
      "Property Address",
      "Type",
      "Amount",
      "Next Payment",
      "Status",
    ];

    const rows = clientsTableData.map((c) => [
      c.clientId,
      c.name,
      c.propertyName,
      c.propertyAddress,
      c.type,
      c.amount.toString(),
      c.nextPayment,
      c.status,
    ]);

    const csvContent = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-0 sm:ml-[80px]" : "ml-0 sm:ml-[260px]"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-4.5rem)] flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">My Clients</h1>
                <p className="mt-1 text-xs text-slate-500">
                  Track and manage client portfolios efficiently.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:bg-slate-50">
                  <Calendar className="size-3.5 shrink-0 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Last updated: {lastUpdated}</span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="flex size-6 items-center justify-center rounded-md text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    aria-label="Refresh"
                  >
                    <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                  </button>
                </div>
                <Button
                  onClick={handleExport}
                  className="shrink-0 h-9 rounded-xl px-3.5 text-xs font-semibold bg-indigo-600 outline-none text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Download className="mr-1.5 size-3.5" strokeWidth={2.5} />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Summary cards */}
            <ClientsCards />

            {/* Clients table */}
            <ClientsTable />
          </div>
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
