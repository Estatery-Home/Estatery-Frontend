"use client";

/**
 * Property detail — context list or GET /api/properties/:id/ when opened directly.
 */
import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useProperties } from "@/contexts/PropertiesContext";
import {
  getPropertyImage,
  getPropertyLocation,
  getPropertyPriceDisplay,
  getPropertyStatusBadgeClass,
  getPropertyStatusDisplay,
  getRentalPeriodLabel,
  PROPERTY_STATUSES,
  propertyFromApiJson,
} from "@/lib/properties";
import type { Property } from "@/lib/properties";
import type { PropertyStatusApi } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { fetchPropertyFromApi, updateProperty } from "@/lib/api-client";
import { bumpPropertyCatalogCache } from "@/lib/catalog-bump";

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getPropertyById, getOtherProperties, refetchProperties, applyPropertyFromApi } = useProperties();
  const [fetched, setFetched] = React.useState<Property | null>(null);
  const [fetching, setFetching] = React.useState(false);
  const [statusDraft, setStatusDraft] = React.useState<PropertyStatusApi>("available");
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  const fromContext = id ? getPropertyById(id) : undefined;
  const property = fromContext ?? fetched ?? undefined;
  const moreProperties = property ? getOtherProperties(property.id) : [];

  React.useEffect(() => {
    if (property) setStatusDraft(property.status);
  }, [property?.id, property?.status]);

  const persistListingStatus = React.useCallback(
    async (nextStatus: PropertyStatusApi) => {
      if (!property) return;
      const numId = typeof property.id === "number" ? property.id : parseInt(String(property.id), 10);
      if (Number.isNaN(numId)) {
        setStatusFeedback("Invalid property id.");
        return;
      }
      if (nextStatus === property.status) return;
      setStatusSaving(true);
      setStatusFeedback(null);
      try {
        const res = await updateProperty(numId, { status: nextStatus });
        applyPropertyFromApi(res.property);
        bumpPropertyCatalogCache();
        await refetchProperties();
        const merged = propertyFromApiJson(res.property);
        if (fetched && merged) {
          setFetched((prev) => (prev ? { ...prev, ...merged } : prev));
        }
        setStatusFeedback("Status updated.");
      } catch (e) {
        setStatusDraft(property.status);
        setStatusFeedback(e instanceof Error ? e.message : "Could not update status.");
      } finally {
        setStatusSaving(false);
      }
    },
    [property, fetched, refetchProperties, applyPropertyFromApi]
  );

  React.useEffect(() => {
    if (!id || fromContext) {
      setFetched(null);
      return;
    }
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) return;
    let cancelled = false;
    setFetching(true);
    void fetchPropertyFromApi(numId).then((raw) => {
      if (cancelled) return;
      const p = propertyFromApiJson(raw);
      setFetched(p);
      setFetching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, fromContext]);

  if (!property && fetching) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl rounded-xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-[#64748b]">Loading property…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl rounded-xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-[#64748b]">Property not found.</p>
          <Button onClick={() => navigate("/dashboard/properties")} variant="outline" className="mt-4">
            Back to Properties
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/dashboard/properties"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[var(--logo)]"
          >
            <ArrowLeft className="size-4" />
            Properties
          </Link>
          {fetched && !fromContext ? (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => void refetchProperties()}>
              Sync my listings
            </Button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <div className="aspect-[16/9] max-h-[420px] w-full overflow-hidden bg-[#f1f5f9]">
            <img
              src={getPropertyImage(property)}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-xl font-bold text-[#1e293b] sm:text-2xl">{property.title}</h1>
            <div className="mt-2">
              <span
                className={cn(
                  "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
                  getPropertyStatusBadgeClass(property.status)
                )}
              >
                {getPropertyStatusDisplay(property.status)}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[#64748b]">
              <MapPin className="size-4 shrink-0" />
              {getPropertyLocation(property)}
            </p>
            <p className="mt-4 text-xl font-bold text-[var(--logo)] sm:text-2xl">
              {getPropertyPriceDisplay(property)}
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              Rental period:{" "}
              <span className="font-medium text-[#1e293b]">{getRentalPeriodLabel(property)}</span>
            </p>
            {(property.primary_video?.video || property.videos?.[0]?.video) ? (
              <div className="mt-5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Property video</p>
                <video controls className="max-h-[360px] w-full rounded-lg border border-[#e2e8f0] bg-black">
                  <source src={property.primary_video?.video ?? property.videos?.[0]?.video ?? ""} />
                </video>
              </div>
            ) : null}
            {isAuthenticated ? (
              <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                  Listing status
                </Label>
                <p className="mt-1 text-xs text-[#64748b]">
                  Set to <strong className="text-[#1e293b]">available</strong> when accepting bookings,{" "}
                  <strong className="text-[#1e293b]">rented</strong> when the unit is occupied, or{" "}
                  <strong className="text-[#1e293b]">under maintenance</strong> when it is not bookable.{" "}
                  <span className="text-[#94a3b8]">Changes save as soon as you pick a value.</span>
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="min-w-[12rem] space-y-1.5">
                    <Select
                      value={statusDraft}
                      onValueChange={(v) => {
                        const next = v as PropertyStatusApi;
                        setStatusFeedback(null);
                        setStatusDraft(next);
                        if (next !== property.status) {
                          void persistListingStatus(next);
                        }
                      }}
                    >
                      <SelectTrigger
                        disabled={statusSaving}
                        className="border-[#e2e8f0] bg-white"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getPropertyStatusDisplay(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {statusSaving ? (
                    <span className="pb-2 text-xs text-[#64748b]">Saving…</span>
                  ) : null}
                </div>
                {statusFeedback ? (
                  <p
                    className={`mt-2 text-xs ${
                      statusFeedback === "Status updated." ? "text-emerald-700" : "text-amber-800"
                    }`}
                  >
                    {statusFeedback}
                  </p>
                ) : null}
              </div>
            ) : null}
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
              <p className="mt-6 leading-relaxed text-[#64748b]">{property.description}</p>
            )}
          </div>
        </div>

        {moreProperties.length > 0 ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold text-[#1e293b]">More properties</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreProperties.map((prop) => (
                <Link
                  key={prop.id}
                  to={`/dashboard/properties/${prop.id}`}
                  className="group relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#cbd5e1] hover:shadow-xl active:scale-[1.01]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#f1f5f9]">
                    <img
                      src={getPropertyImage(prop)}
                      alt={prop.title}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative p-4">
                    <p className="truncate font-medium text-[#1e293b] group-hover:text-[var(--logo)]">
                      {prop.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#64748b]">{getPropertyLocation(prop)}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--logo)]">
                      {getPropertyPriceDisplay(prop)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
