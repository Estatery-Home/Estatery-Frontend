"use client";

/**
 * Dashboard – Main admin dashboard screen.
 * Shows overview cards, listings chart (rent vs sale), my properties, recent payments.
 * Includes refresh and CSV export actions. Uses PropertiesContext for property data.
 */
import * as React from "react";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DashboardLayout,
  OverviewCards,
  ListingsChart,
  MyProperties,
  RecentPayments,
} from "@/components/dashboard";
import { useProperties } from "@/contexts/PropertiesContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getPropertyLocation, getPropertyPriceDisplay } from "@/lib/properties";

export default function Dashboard() {
  // Timestamp shown as "Last updated" – updated when user clicks refresh
  const [lastUpdated, setLastUpdated] = React.useState("July 08, 2025");
  // True while refresh is in progress (shows spinning icon)
  const [refreshing, setRefreshing] = React.useState(false);
  const { properties } = useProperties();
  const { profile } = useUserProfile();

  /** Simulate refresh: set loading state, update lastUpdated timestamp, clear after 800ms */
  const handleRefresh = () => {
    setRefreshing(true);
    setLastUpdated(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    setTimeout(() => setRefreshing(false), 800);
  };

  /** Build CSV from overview metrics, payments, and properties; trigger browser download */
  const handleExport = () => {
    // Static overview stats – in a real app these would come from an API
    const overview = [
      ["Metric", "Value", "Trend"],
      ["Total Revenue", "₵23,569.00", "+12%"],
      ["Total Properties Sale", "904", "-8.5%"],
      ["Total Properties Rent", "573", "+5.7%"],
    ];

    const paymentHeader = ["Payment ID", "Due Date", "Property", "Customer", "Type", "Amount", "Status"];
    // Mock payment rows – replace with real data from API when available
    const payments = [
      ["23487", "2025-07-08", "Oak Grove Estates", "David Martinez", "Rent", "293.00", "pending"],
      ["23488", "2025-07-09", "Maple Heights", "Sarah Johnson", "Rent", "320.00", "cancelled"],
      ["23489", "2025-07-10", "Pine View", "Mike Chen", "Deposit", "15200.00", "paid"],
    ];

    const propertyHeader = ["ID", "Title", "Location", "Price", "Type", "Status"];
    // Build property rows from PropertiesContext – this is real data
    const propertyRows = properties.map((p) => [
      p.id,
      p.title,
      getPropertyLocation(p),
      getPropertyPriceDisplay(p),
      p.property_type ?? "",
      p.status ?? "",
    ]);

    // Combine all sections into one CSV – escape quotes in cells so CSV parses correctly
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
    URL.revokeObjectURL(url); // Clean up the blob URL so the browser can free memory
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Dashboard header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Welcome back, {profile.username || "User"}!</h1>
            <p className="mt-1 text-xs text-[#64748b]">
              Track and manage your property dashboard efficiently.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-sm">
              <Calendar className="size-3.5 shrink-0 text-[#64748b]" />
              <span className="text-xs font-medium text-[#64748b]">Last updated: {lastUpdated}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex size-6 items-center justify-center rounded text-[var(--logo)] transition-colors hover:bg-[var(--logo-muted)] hover:text-[var(--logo-hover)]"
                aria-label="Refresh"
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
              </button>
            </div>
            <Button
              onClick={handleExport}
              className="h-9 shrink-0 rounded-lg bg-[var(--logo)] px-3 text-xs text-white hover:bg-[var(--logo-hover)]"
            >
              <Download className="mr-1.5 size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Overview cards (3) + My Properties side column; ListingsChart below */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <OverviewCards />
            <ListingsChart />
          </div>
          <div className="flex flex-col lg:col-span-1">
            <MyProperties />
          </div>
        </div>

        <RecentPayments />
      </div>
    </DashboardLayout>
  );
}
