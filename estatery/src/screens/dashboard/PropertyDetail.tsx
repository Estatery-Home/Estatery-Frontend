"use client";

import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, TopBar } from "@/components/dashboard";
import { getPropertyById, getOtherProperties } from "@/lib/properties";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const property = id ? getPropertyById(id) : undefined;
  const moreProperties = property ? getOtherProperties(property.id) : [];

  if (!property) {
    return (
      <div className="flex min-h-screen bg-[#f1f5f9]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-4xl rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
              <p className="text-[#64748b]">Property not found.</p>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[#21438D]"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>

            {/* Selected property detail */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
              <div className="aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-[#f1f5f9]">
                <img
                  src={property.image}
                  alt={property.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 sm:p-8">
                <h1 className="text-2xl font-bold text-[#1e293b] sm:text-3xl">{property.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-[#64748b]">
                  <MapPin className="size-4 shrink-0" />
                  {property.location}
                </p>
                <p className="mt-4 text-2xl font-bold text-[#21438D]">
                  {property.price}
                  <span className="text-base font-normal text-[#64748b]"> per month</span>
                </p>
                {(property.beds != null || property.baths != null || property.sqft) && (
                  <div className="mt-4 flex flex-wrap gap-6 text-sm text-[#64748b]">
                    {property.beds != null && (
                      <span className="flex items-center gap-1.5">
                        <Bed className="size-4" />
                        {property.beds} Beds
                      </span>
                    )}
                    {property.baths != null && (
                      <span className="flex items-center gap-1.5">
                        <Bath className="size-4" />
                        {property.baths} Baths
                      </span>
                    )}
                    {property.sqft && (
                      <span className="flex items-center gap-1.5">
                        <Square className="size-4" />
                        {property.sqft} sq ft
                      </span>
                    )}
                  </div>
                )}
                {property.description && (
                  <p className="mt-6 text-[#64748b] leading-relaxed">{property.description}</p>
                )}
              </div>
            </div>

            {/* More properties */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-[#1e293b]">More properties</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {moreProperties.map((prop) => (
                  <Link
                    key={prop.id}
                    to={`/dashboard/properties/${prop.id}`}
                    className="group rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#f1f5f9]">
                      <img
                        src={prop.image}
                        alt={prop.name}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-[#1e293b] group-hover:text-[#21438D] truncate">
                        {prop.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[#64748b]">{prop.location}</p>
                      <p className="mt-2 text-sm font-medium text-[#1e293b]">
                        {prop.price}
                        <span className="font-normal text-[#64748b]"> per month</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
