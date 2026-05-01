/**
 * Property types – aligned with API Property object (PropertySerializer).
 */
import type { PropertyTypeApi, PropertyStatusApi, ListingTypeApi, PropertyConditionApi } from "./api-types";

const API_ORIGIN =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/i, "")
    : "http://localhost:8000";

/** Resolve relative media paths from Django (e.g. /media/...) for <img src>. */
export function apiMediaUrl(path: string | undefined | null): string | undefined {
  if (path == null || typeof path !== "string") return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? `${API_ORIGIN}${trimmed}` : `${API_ORIGIN}/${trimmed}`;
}

function normalizePrimaryImage(raw: unknown): { image: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const url =
    (typeof o.image_url === "string" && o.image_url) ||
    apiMediaUrl(typeof o.image === "string" ? o.image : undefined);
  return url ? { image: url } : null;
}

function normalizePrimaryVideo(raw: unknown): { id?: number; video: string; is_primary?: boolean } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const url =
    (typeof o.video_url === "string" && o.video_url) ||
    apiMediaUrl(typeof o.video === "string" ? o.video : undefined);
  if (!url) return null;
  return {
    id: typeof o.id === "number" ? o.id : undefined,
    video: url,
    is_primary: Boolean(o.is_primary),
  };
}

function normalizeImages(raw: unknown): Property["images"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url =
        (typeof o.image_url === "string" && o.image_url) ||
        apiMediaUrl(typeof o.image === "string" ? o.image : undefined);
      if (!url) return null;
      return {
        id: typeof o.id === "number" ? o.id : undefined,
        image: url,
        is_primary: Boolean(o.is_primary),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

function normalizeVideos(raw: unknown): Property["videos"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url =
        (typeof o.video_url === "string" && o.video_url) ||
        apiMediaUrl(typeof o.video === "string" ? o.video : undefined);
      if (!url) return null;
      return {
        id: typeof o.id === "number" ? o.id : undefined,
        video: url,
        is_primary: Boolean(o.is_primary),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

/**
 * Map API / loose values to canonical listing status (Django Property.STATUS_CHOICES keys).
 * Anything unrecognized falls back to "available" so the UI never breaks.
 */
export function normalizePropertyStatus(raw: unknown): PropertyStatusApi {
  if (raw == null || raw === "") return "available";
  const t = String(raw).trim();
  if (!t) return "available";
  const s = t.toLowerCase().replace(/\s+/g, "_");
  if (s === "available") return "available";
  if (s === "rented") return "rented";
  if (s === "maintenance" || s === "under_maintenance") return "maintenance";
  return "available";
}

export function normalizePropertyCondition(raw: unknown): PropertyConditionApi {
  const value = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (value === "newly_built" || value === "fairly_used" || value === "used") return value;
  return "fairly_used";
}

/** Map GET /api/properties/… JSON to local Property (shared by context + detail fetch). */
export function propertyFromApiJson(raw: unknown): Property | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  if (Number.isNaN(id)) return null;
  const listingRaw = o.listing_type;
  const listing_type: ListingTypeApi =
    listingRaw === "sale" || listingRaw === "rent" ? listingRaw : "rent";
  const statusRaw =
    o.status ??
    o.listing_status ??
    (typeof o["Status"] === "string" ? o["Status"] : undefined);
  const status = normalizePropertyStatus(statusRaw);
  let owner_id: number | undefined;
  if (o.owner != null && typeof o.owner === "object") {
    const oid = (o.owner as Record<string, unknown>).id;
    if (typeof oid === "number" && !Number.isNaN(oid)) owner_id = oid;
    else if (typeof oid === "string") {
      const n = parseInt(oid, 10);
      if (!Number.isNaN(n)) owner_id = n;
    }
  }
  const ptype = String(o.property_type ?? "house");
  const property_type = (
    ["apartment", "house", "condo", "villa", "studio"].includes(ptype) ? ptype : "house"
  ) as PropertyTypeApi;

  return {
    id,
    title: String(o.title ?? ""),
    address: String(o.address ?? ""),
    city: String(o.city ?? ""),
    state: o.state != null ? String(o.state) : undefined,
    country: String(o.country ?? ""),
    zip_code: o.zip_code != null ? String(o.zip_code) : undefined,
    description: String(o.description ?? ""),
    daily_price: String(o.daily_price ?? "0"),
    monthly_price: o.monthly_price != null && o.monthly_price !== "" ? String(o.monthly_price) : "0",
    currency: String(o.currency ?? "ghs"),
    bedrooms: Number(o.bedrooms ?? 0),
    bathrooms: Number(o.bathrooms ?? 0),
    area: Number(o.area ?? 0),
    property_type,
    listing_type,
    property_condition: normalizePropertyCondition(o.property_condition),
    status,
    owner_id,
    has_wifi: Boolean(o.has_wifi),
    has_parking: Boolean(o.has_parking),
    has_pool: Boolean(o.has_pool),
    has_gym: Boolean(o.has_gym),
    is_furnished: Boolean(o.is_furnished),
    has_kitchen: o.has_kitchen === undefined ? true : Boolean(o.has_kitchen),
    has_prepaid_meter: Boolean(o.has_prepaid_meter),
    has_postpaid_meter: Boolean(o.has_postpaid_meter),
    has_24h_electricity: Boolean(o.has_24h_electricity),
    has_kitchen_cabinets: Boolean(o.has_kitchen_cabinets),
    has_dining_area: Boolean(o.has_dining_area),
    custom_facilities: Array.isArray(o.custom_facilities)
      ? o.custom_facilities.map((item) => String(item)).filter(Boolean)
      : [],
    times_booked: Number(o.times_booked ?? 0),
    min_stay_months: Number(o.min_stay_months ?? 12),
    max_stay_months: o.max_stay_months != null ? Number(o.max_stay_months) : undefined,
    monthly_cycle_start: o.monthly_cycle_start != null ? Number(o.monthly_cycle_start) : undefined,
    security_deposit_months: o.security_deposit_months != null ? String(o.security_deposit_months) : undefined,
    primary_image: normalizePrimaryImage(o.primary_image),
    images: normalizeImages(o.images),
    primary_video: normalizePrimaryVideo(o.primary_video),
    videos: normalizeVideos(o.videos),
    created_at: o.created_at ? String(o.created_at) : undefined,
    upload_timestamp: o.upload_timestamp ? String(o.upload_timestamp) : undefined,
    updated_at: o.updated_at ? String(o.updated_at) : undefined,
  };
}

/** Local property shape matching API – id can be number (from API) or string (local before sync) */
export type Property = {
  id: number | string;
  title: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zip_code?: string;
  description: string;
  daily_price: string;
  monthly_price: string;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  property_type: PropertyTypeApi;
  listing_type?: ListingTypeApi;
  property_condition?: PropertyConditionApi;
  status: PropertyStatusApi;
  /** Present when property JSON includes owner (for edit permissions in UI). */
  owner_id?: number;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_pool?: boolean;
  has_gym?: boolean;
  is_furnished?: boolean;
  has_kitchen?: boolean;
  has_prepaid_meter?: boolean;
  has_postpaid_meter?: boolean;
  has_24h_electricity?: boolean;
  has_kitchen_cabinets?: boolean;
  has_dining_area?: boolean;
  custom_facilities?: string[];
  times_booked?: number;
  min_stay_months?: number;
  max_stay_months?: number;
  monthly_cycle_start?: number;
  security_deposit_months?: string;
  images?: { id?: number; image: string; is_primary?: boolean }[];
  primary_image?: { image: string } | null;
  videos?: { id?: number; video: string; is_primary?: boolean }[];
  primary_video?: { id?: number; video: string; is_primary?: boolean } | null;
  created_at?: string;
  upload_timestamp?: string;
  updated_at?: string;
};

/** Display helper: full location string from address, city, country */
export function getPropertyLocation(p: Property): string {
  const parts = [p.address, p.city, p.country].filter(Boolean);
  return parts.join(", ") || "Address TBD";
}

/** Display helper: primary image URL */
export function getPropertyImage(p: Property): string {
  const primary = p.primary_image as { image?: string; image_url?: string } | null | undefined;
  const fromPrimary = apiMediaUrl(primary?.image_url) ?? primary?.image;
  if (fromPrimary) return fromPrimary;
  const first = p.images?.[0] as { image?: string; image_url?: string } | undefined;
  const fromFirst = apiMediaUrl(first?.image_url) ?? first?.image;
  if (fromFirst) return fromFirst;
  return "/images/property-1.webp";
}

/** Display helper: price with period (monthly for rent, one-time for sale). */
export function getPropertyPriceDisplay(p: Property): string {
  const prefix =
    p.currency === "ghs" ? "GH₵" : p.currency === "usd" ? "GH₵" : p.currency === "cfa" ? "GH₵" : "GH₵";
  if (p.listing_type === "sale") return `${prefix}${p.monthly_price}`;
  return `${prefix}${p.monthly_price} / month`;
}

/** Display helper: listing type (Rent / For Sale) */
export function getListingTypeDisplay(listingType?: ListingTypeApi): string {
  const map: Record<ListingTypeApi, string> = {
    rent: "For Rent",
    sale: "For Sale",
  };
  return listingType ? map[listingType] : "For Rent";
}

/** Display helper: human-readable status */
export function getPropertyStatusDisplay(status: PropertyStatusApi): string {
  const map: Record<PropertyStatusApi, string> = {
    available: "Available",
    rented: "Rented",
    maintenance: "Under maintenance",
  };
  return map[status] ?? status;
}

/** Tailwind classes for listing-status pills (available=blue, rented=green, maintenance=amber). */
export function getPropertyStatusBadgeClass(status: PropertyStatusApi): string {
  const map: Record<PropertyStatusApi, string> = {
    available: "bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-300/80",
    rented: "bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-300/80",
    maintenance: "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-300/80",
  };
  return map[status] ?? "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-300/70";
}

/** Hex fills for charts / SVG (blue, green, amber). */
export const PROPERTY_STATUS_HEX: Record<PropertyStatusApi, string> = {
  available: "#2563eb",
  rented: "#16a34a",
  maintenance: "#d97706",
};

/** Map min/max stay months to rental period label (N/A for sale) */
export function getRentalPeriodLabel(p: Property): string {
  if (p.listing_type === "sale") return "—";
  const min = p.min_stay_months ?? 12;
  const max = p.max_stay_months;
  if (max && max !== min) return `${min}–${max} months`;
  if (min === 6) return "6 months";
  if (min === 12) return "1 year";
  if (min === 24) return "2 years";
  return `${min} months`;
}

export const PROPERTY_TYPES: PropertyTypeApi[] = ["apartment", "house", "condo", "villa", "studio"];
export const LISTING_TYPES: ListingTypeApi[] = ["rent", "sale"];
export const PROPERTY_CONDITIONS: PropertyConditionApi[] = ["newly_built", "fairly_used", "used"];
export const PROPERTY_STATUSES: PropertyStatusApi[] = ["available", "rented", "maintenance"];

export const PROPERTY_CURRENCIES = ["ghs", "usd", "cfa"] as const;
export type PropertyCurrencyApi = (typeof PROPERTY_CURRENCIES)[number];
