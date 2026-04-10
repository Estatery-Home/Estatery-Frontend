"use client";

/**
 * Clients — customers (tenants) linked via bookings on your properties.
 * Data: GET /api/host/clients/
 */
import * as React from "react";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard";
import { ClientsCards } from "@/components/clients/ClientsCards";
import { ClientsTable } from "@/components/clients/clientsTable";
import { fetchHostClients } from "@/lib/api-client";
import { mapHostClientListRow } from "@/lib/clients";
import type { ClientRow } from "@/lib/clients";

export default function Clients() {
  const STORAGE_KEY = "clients-last-updated";

  const [lastUpdated, setLastUpdated] = React.useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    }
    return "";
  });
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [summary, setSummary] = React.useState({
    total: 0,
    ongoing: 0,
    completed: 0,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = await fetchHostClients();
    if (data?.clients) {
      setRows(data.clients.map(mapHostClientListRow));
      setSummary(data.summary);
    } else {
      setRows([]);
      setSummary({ total: 0, ongoing: 0, completed: 0 });
    }
    const formatted = new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastUpdated(formatted);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, formatted);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  };

  const handleExport = () => {
    const header = [
      "Customer ID",
      "Name",
      "Property",
      "Address",
      "Type",
      "Amount",
      "Next Payment",
      "Status",
    ];

    const csvRows = rows.map((c) => [
      c.clientId,
      c.name,
      c.propertyName,
      c.propertyAddress,
      c.type,
      String(c.amount),
      c.nextPayment || "—",
      c.status,
    ]);

    const csvContent = [header, ...csvRows]
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">My Clients</h1>
            <p className="mt-1 text-xs text-[#64748b]">
              Customers (tenant accounts) who have booked your properties.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-sm">
              <Calendar className="size-3.5 shrink-0 text-[#64748b]" />
              <span className="text-xs font-medium text-[#64748b]">
                Last updated: {lastUpdated || "—"}
              </span>
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

        <ClientsCards
          total={summary.total}
          ongoing={summary.ongoing}
          completed={summary.completed}
          loading={loading}
        />

        <ClientsTable rows={rows} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
