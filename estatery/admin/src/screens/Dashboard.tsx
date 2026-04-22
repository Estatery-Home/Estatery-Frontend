"use client";

/**
 * Dashboard – Main admin dashboard screen.
 * KPIs, listings chart, and payments from GET /api/dashboard/host/; properties from context (my listings).
 */
import * as React from "react";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDashboardCurrency } from "@/lib/utils";
import {
  DashboardLayout,
  OverviewCards,
  ListingsChart,
  MyProperties,
  RecentPayments,
} from "@/components/dashboard";
import type { PaymentDisplay } from "@/components/dashboard/RecentPayments";
import { useProperties } from "@/contexts/PropertiesContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getPropertyLocation, getPropertyPriceDisplay } from "@/lib/properties";
import { fetchHostDashboard } from "@/lib/api-client";
import type { HostDashboardResponse, HostRecentPaymentRow } from "@/lib/api-types";

function mapPaymentRow(p: HostRecentPaymentRow): PaymentDisplay {
  return {
    id: p.id,
    booking: p.booking,
    payment_type: p.payment_type,
    month_number: p.month_number,
    amount: p.amount,
    due_date: p.due_date,
    status: p.status,
    paid_date: p.paid_date ?? undefined,
    transaction_id: p.transaction_id,
    property_title: p.property_title,
    customer: p.customer,
  };
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [dashLoading, setDashLoading] = React.useState(true);
  const [dash, setDash] = React.useState<HostDashboardResponse | null>(null);
  const { properties, refetchProperties } = useProperties();
  const { profile } = useUserProfile();

  const loadDashboard = React.useCallback(async () => {
    setDashLoading(true);
    try {
      const d = await fetchHostDashboard();
      setDash(d);
      setLastUpdated(
        new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } finally {
      setDashLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    void Promise.all([loadDashboard(), refetchProperties()]).finally(() => {
      setRefreshing(false);
    });
  };

  const paymentRows = React.useMemo(
    () => (dash?.recent_payments ?? []).map(mapPaymentRow),
    [dash?.recent_payments]
  );

  const handleExport = () => {
    const currency = dash?.currency ?? "ghs";
    const overview = [
      ["Metric", "Value"],
      [
        "Total Revenue",
        dash?.revenue
          ? formatDashboardCurrency(currency, dash.revenue.total)
          : "—",
      ],
      [
        "Properties for sale",
        dash != null ? String(dash.properties.sale_listings) : "—",
      ],
      [
        "Properties for rent",
        dash != null ? String(dash.properties.rent_listings) : "—",
      ],
    ];

    const paymentHeader = ["Payment ID", "Due Date", "Property", "Customer", "Type", "Amount", "Status"];
    const payments = paymentRows.map((p) => [
      String(p.id),
      p.due_date,
      p.property_title ?? "",
      p.customer ?? "",
      p.payment_type,
      p.amount,
      p.status,
    ]);

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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-6 py-5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Admin dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Welcome back, {profile.username || "User"}!</h1>
            <p className="mt-1 text-sm text-slate-500">Track and manage your property dashboard efficiently.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
              <Calendar className="size-3.5 shrink-0 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">Last updated: {lastUpdated || "—"}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex size-6 items-center justify-center rounded text-slate-500 transition-colors hover:bg-white hover:text-blue-600"
                aria-label="Refresh"
              >
                <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
              </button>
            </div>
            <Button
              onClick={handleExport}
              className="h-9 shrink-0 rounded-lg bg-blue-600 px-3 text-xs text-white hover:bg-blue-700"
            >
              <Download className="mr-1.5 size-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
          <div className="flex flex-col gap-6 lg:col-span-3">
            <OverviewCards
              properties={dash?.properties ?? null}
              bookings={dash?.bookings ?? null}
              revenue={dash?.revenue ?? null}
              comparison={dash?.comparison ?? null}
              currency={dash?.currency ?? "ghs"}
              loading={dashLoading}
            />
            <ListingsChart
              listingsChart={dash?.listings_chart ?? null}
              loading={dashLoading}
              onRefresh={loadDashboard}
            />
          </div>
          <div className="flex flex-col lg:col-span-1">
            <MyProperties />
          </div>
        </div>

        <RecentPayments
          payments={paymentRows}
          loading={dashLoading}
          onRefetch={loadDashboard}
        />
      </div>
    </DashboardLayout>
  );
}
