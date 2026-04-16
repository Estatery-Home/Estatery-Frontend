"use client";

/**
 * PropertiesList – Properties management screen.
 * Shows charts (ListingViewsChart, PropertyListedDonut), table of properties, and Add Property button.
 * Uses PropertiesContext for data; AddPropertyModal adds new properties via API.
 */
import * as React from "react";
import { DashboardLayout } from "@/components/dashboard";
import { AddPropertyModal } from "@/components/dashboard/AddPropertyModal";
import {
  PropertiesPageHeader,
  ListingViewsChart,
  PropertyListedDonut,
  PropertyListingTable,
} from "@/components/dashboard/properties";
import { useProperties } from "@/contexts/PropertiesContext";
import { fetchHostDashboard } from "@/lib/api-client";
import type { HostDashboardResponse } from "@/lib/api-types";

export default function PropertiesList() {
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const { properties, loading, refetchProperties } = useProperties();
  const [hostDash, setHostDash] = React.useState<HostDashboardResponse | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetchHostDashboard().then((d) => {
      if (!cancelled) setHostDash(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshHostDash = React.useCallback(() => {
    void fetchHostDashboard().then(setHostDash);
  }, []);

  const handlePropertyAdded = React.useCallback(async () => {
    await refetchProperties();
    const d = await fetchHostDashboard();
    setHostDash(d);
  }, [refetchProperties]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PropertiesPageHeader onAddProperty={() => setAddModalOpen(true)} />

        {loading ? (
          <p className="text-sm text-[#64748b]">Loading your properties…</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <ListingViewsChart
            activityChart={hostDash?.activity_chart}
            onRefresh={refreshHostDash}
          />
          <PropertyListedDonut />
        </div>

        <PropertyListingTable properties={properties} />
      </div>
      <AddPropertyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </DashboardLayout>
  );
}
