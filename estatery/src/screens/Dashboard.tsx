"use client";

/**
 * Main Dashboard – overview cards, listings chart, my properties, recent payments.
 * Refresh and export actions; uses PropertiesContext for property count.
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import {
  Sidebar,
  TopBar,
  LogoutConfirmDialog,
  OverviewCards,
  ListingsChart,
  MyProperties,
  RecentPayments,
} from "@/components/dashboard";
import { useProperties } from "@/contexts/PropertiesContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getPropertyLocation, getPropertyPriceDisplay } from "@/lib/properties";

export default function Dashboard() {
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState("July 08, 2025");
  const [refreshing, setRefreshing] = React.useState(false);
  const { logout } = useAuth();
  const { properties } = useProperties();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  /* Simulate refresh: show loading, update lastUpdated, clear after 800ms */
  const handleRefresh = () => {
    setRefreshing(true);
    setLastUpdated(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    setTimeout(() => setRefreshing(false), 800);
  };

  /* Build CSV from overview, payments, properties; trigger download */
  const handleExport = () => {
    const overview = [
      ["Metric", "Value", "Trend"],
      ["Total Revenue", "₵23,569.00", "+12%"],
      ["Total Properties Sale", "904", "-8.5%"],
      ["Total Properties Rent", "573", "+5.7%"],
    ];

    const paymentHeader = ["Payment ID", "Due Date", "Property", "Customer", "Type", "Amount", "Status"];
    const payments = [
      ["23487", "2025-07-08", "Oak Grove Estates", "David Martinez", "Rent", "293.00", "pending"],
      ["23488", "2025-07-09", "Maple Heights", "Sarah Johnson", "Rent", "320.00", "cancelled"],
      ["23489", "2025-07-10", "Pine View", "Mike Chen", "Deposit", "15200.00", "paid"],
    ];

    const propertyHeader = ["ID", "Title", "Location", "Price", "Type", "Status"];
    const propertyRows = properties.map((p) => [
      p.id,
      p.title,
      getPropertyLocation(p),
      getPropertyPriceDisplay(p),
      p.property_type ?? "",
      p.status ?? "",
    ]);

    const csvSections = [
      ["Dashboard Overview"],
      ...overview.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      [""],
      ["Recent Payments"],
      paymentHeader.map((c) => `"${c}"`).join(","),
      ...payments.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
      [""],
      ["My Properties"],
      propertyHeader.map((c) => `"${c}"`).join(","),
      ...propertyRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ];

    const csvContent = csvSections.map((row) => (Array.isArray(row) ? row.join(",") : row)).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* Log out, close dialog, redirect to login */
  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-2.75rem)] flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Dashboard header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Welcome back, {profile.username || "User"}!</h1>
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

            {/* Overview cards (3) + My Properties side column; ListingsChart below; My Properties spans both rows */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-2 lg:items-stretch">
              <div className="lg:col-span-3">
                <OverviewCards />
              </div>
              <div className="lg:col-start-4 lg:row-span-2 lg:row-start-1 min-h-0 flex flex-col">
                <MyProperties />
              </div>
              <div className="lg:col-span-3 min-h-0 flex flex-col">
                <ListingsChart />
              </div>
            </div>

            {/* Recent Payments */}
            <RecentPayments />
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
