"use client";

/**
 * Property detail – single property by ID; image, info, similar listings.
 * Uses PropertiesContext.getPropertyById, getOtherProperties.
 */
import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useProperties } from "@/contexts/PropertiesContext";
import {
  getPropertyImage,
  getPropertyLocation,
  getPropertyPriceDisplay,
  getRentalPeriodLabel,
} from "@/lib/properties";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const { getPropertyById, getOtherProperties } = useProperties();
  const property = id ? getPropertyById(id) : undefined;
  const moreProperties = property ? getOtherProperties(property.id) : [];

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate("/auth/login", { replace: true });
  };

  if (!property) {
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
        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          onConfirm={handleLogoutConfirm}
        />
      </div>
    );
  }

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
          <div className="mx-auto max-w-6xl space-y-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[var(--logo)]"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>

            {/* Selected property detail */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
              <div className="aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-[#f1f5f9]">
                <img
                  src={getPropertyImage(property)}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 sm:p-8">
                <h1 className="text-2xl font-bold text-[#1e293b] sm:text-3xl">{property.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-[#64748b]">
                  <MapPin className="size-4 shrink-0" />
                  {getPropertyLocation(property)}
                </p>
                <p className="mt-4 text-2xl font-bold text-[var(--logo)]">
                  {getPropertyPriceDisplay(property)}
                </p>
                <p className="mt-1 text-sm text-[#64748b]">
                  Rental period: <span className="font-medium text-[#1e293b]">{getRentalPeriodLabel(property)}</span>
                </p>
                {(property.bedrooms != null || property.bathrooms != null || property.area != null) && (
                  <div className="mt-4 flex flex-wrap gap-6 text-sm text-[#64748b]">
                    {property.bedrooms != null && (
                      <span className="flex items-center gap-1.5">
                        <Bed className="size-4" />
                        {property.bedrooms} Beds
                      </span>
                    )}
                    {property.bathrooms != null && (
                      <span className="flex items-center gap-1.5">
                        <Bath className="size-4" />
                        {property.bathrooms} Baths
                      </span>
                    )}
                    {property.area != null && (
                      <span className="flex items-center gap-1.5">
                        <Square className="size-4" />
                        {property.area} sq ft
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
                    className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f1f5f9]">
                      <img
                        src={getPropertyImage(prop)}
                        alt={prop.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="relative p-4">
                      <p className="font-medium text-[#1e293b] group-hover:text-[var(--logo)] truncate">
                        {prop.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[#64748b]">{getPropertyLocation(prop)}</p>
                      <p className="mt-2 text-sm font-medium text-[#1e293b]">
                        {getPropertyPriceDisplay(prop)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
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
