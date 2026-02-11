"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { ClientsCards } from "@/components/clients/ClientsCards";
import { ClientsTable } from "@/components/clients/clientsTable";
import { clientsTableData } from "@/lib/clients";

export default function Clients() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [lastUpdated] = React.useState("July 08, 2025");
  const [refreshing, setRefreshing] = React.useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

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
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">My Clients</h1>
                <p className="mt-1 text-[#64748b]">
                  Track and manage your property dashboard efficiently.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 shadow-sm">
                  <Calendar className="size-4 shrink-0 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Last updated: {lastUpdated}</span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="flex size-8 items-center justify-center rounded text-[var(--logo)] transition-colors hover:bg-[var(--logo-muted)] hover:text-[var(--logo-hover)]"
                    aria-label="Refresh"
                  >
                    <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                  </button>
                </div>
                <Button
                  onClick={handleExport}
                  className="shrink-0 rounded-lg bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                >
                  <Download className="mr-2 size-4" />
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
