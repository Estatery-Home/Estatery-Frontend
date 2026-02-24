"use client";

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
import type { Property } from "@/lib/properties";

export default function PropertiesList() {
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const { properties, addProperty } = useProperties();

  const tableProperties = properties.filter(
    (p) => p.views != null && p.lastUpdated
  ) as Property[];
  const displayProperties: Property[] =
    tableProperties.length > 0 ? tableProperties : (properties.slice(0, Math.max(5, properties.length)) as Property[]);

  const handlePropertyAdded = React.useCallback(
    (property: Omit<Property, "id">) => {
      addProperty(property);
    },
    [addProperty]
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PropertiesPageHeader onAddProperty={() => setAddModalOpen(true)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <ListingViewsChart />
          <PropertyListedDonut />
        </div>

        <PropertyListingTable properties={displayProperties} />
      </div>
      <AddPropertyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </DashboardLayout>
  );
}
