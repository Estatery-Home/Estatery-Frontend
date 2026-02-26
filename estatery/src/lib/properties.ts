/**
 * Property types – aligned with API Property object.
 * API: title, address, city, country, bedrooms, bathrooms, area, property_type, status, monthly_price.
 */
import type { PropertyTypeApi, PropertyStatusApi } from "./api-types";

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
  status: PropertyStatusApi;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_pool?: boolean;
  has_gym?: boolean;
  is_furnished?: boolean;
  has_kitchen?: boolean;
  min_stay_months?: number;
  max_stay_months?: number;
  monthly_cycle_start?: number;
  security_deposit_months?: string;
  images?: { id?: number; image: string; is_primary?: boolean }[];
  primary_image?: { image: string } | null;
  created_at?: string;
  updated_at?: string;
};

/** Display helper: full location string from address, city, country */
export function getPropertyLocation(p: Property): string {
  const parts = [p.address, p.city, p.country].filter(Boolean);
  return parts.join(", ") || "Address TBD";
}

/** Display helper: primary image URL */
export function getPropertyImage(p: Property): string {
  return p.primary_image?.image ?? p.images?.[0]?.image ?? "/images/property-1.webp";
}

/** Display helper: price with period (e.g. monthly) */
export function getPropertyPriceDisplay(p: Property): string {
  const prefix = p.currency === "ghs" ? "₵" : p.currency === "usd" ? "$" : "";
  return `${prefix}${p.monthly_price} / month`;
}

/** Display helper: human-readable status */
export function getPropertyStatusDisplay(status: PropertyStatusApi): string {
  const map: Record<PropertyStatusApi, string> = {
    available: "Available",
    rented: "Rented",
    maintenance: "Maintenance",
  };
  return map[status] ?? status;
}

/** Map min/max stay months to rental period label */
export function getRentalPeriodLabel(p: Property): string {
  const min = p.min_stay_months ?? 12;
  const max = p.max_stay_months;
  if (max && max !== min) return `${min}–${max} months`;
  if (min === 6) return "6 months";
  if (min === 12) return "1 year";
  if (min === 24) return "2 years";
  return `${min} months`;
}

export const PROPERTY_TYPES: PropertyTypeApi[] = ["apartment", "house", "condo", "villa", "studio"];
export const PROPERTY_STATUSES: PropertyStatusApi[] = ["available", "rented", "maintenance"];

/** Seed data – API-aligned shape for demo (API not ready yet) */
export const properties: Property[] = [
  {
    id: "03483",
    title: "Seaside Retreat",
    address: "258 Coastline Dr",
    city: "Springfield",
    country: "USA",
    description: "Stunning lakefront estate with panoramic views.",
    daily_price: "19.17",
    monthly_price: "575.00",
    currency: "ghs",
    bedrooms: 5,
    bathrooms: 4,
    area: 4200,
    property_type: "house",
    status: "available",
    primary_image: { image: "/images/property-1.webp" },
    min_stay_months: 12,
    created_at: "2025-07-08T00:00:00Z",
    updated_at: "2025-07-08T00:00:00Z",
  },
  {
    id: "03484",
    title: "Mountain Escape",
    address: "123 Summit Ave",
    city: "Denver",
    country: "USA",
    description: "Architectural masterpiece on the coast.",
    daily_price: "40.00",
    monthly_price: "1200.00",
    currency: "ghs",
    bedrooms: 6,
    bathrooms: 5,
    area: 6500,
    property_type: "villa",
    status: "available",
    primary_image: { image: "/images/property-2.webp" },
    min_stay_months: 6,
    created_at: "2025-08-15T00:00:00Z",
    updated_at: "2025-08-15T00:00:00Z",
  },
  {
    id: "03485",
    title: "Urban Loft",
    address: "456 City Center",
    city: "New York",
    country: "USA",
    description: "Luxury penthouse in the heart of the city.",
    daily_price: "83.33",
    monthly_price: "2500.00",
    currency: "ghs",
    bedrooms: 4,
    bathrooms: 3,
    area: 3800,
    property_type: "apartment",
    status: "available",
    primary_image: { image: "/images/property-3.webp" },
    min_stay_months: 24,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2025-09-01T00:00:00Z",
  },
  {
    id: "03486",
    title: "Countryside Villa",
    address: "789 Farm Rd",
    city: "Austin",
    country: "USA",
    description: "Industrial-chic loft with exposed brick.",
    daily_price: "28.33",
    monthly_price: "850.00",
    currency: "ghs",
    bedrooms: 2,
    bathrooms: 2,
    area: 2100,
    property_type: "studio",
    status: "available",
    primary_image: { image: "/images/property-4.webp" },
    min_stay_months: 12,
    created_at: "2025-07-20T00:00:00Z",
    updated_at: "2025-07-20T00:00:00Z",
  },
  {
    id: "03487",
    title: "Cozy Cabin",
    address: "321 Woodland Way",
    city: "Seattle",
    country: "USA",
    description: "Desert oasis with red rock views.",
    daily_price: "21.67",
    monthly_price: "650.00",
    currency: "ghs",
    bedrooms: 4,
    bathrooms: 4,
    area: 3600,
    property_type: "house",
    status: "available",
    primary_image: { image: "/images/property-5.webp" },
    min_stay_months: 6,
    created_at: "2025-06-30T00:00:00Z",
    updated_at: "2025-06-30T00:00:00Z",
  },
  {
    id: "6",
    title: "Oceanfront Paradise",
    address: "Miami Beach",
    city: "Florida",
    country: "USA",
    description: "Direct oceanfront with private dock.",
    daily_price: "4833.33",
    monthly_price: "145000.00",
    currency: "ghs",
    bedrooms: 7,
    bathrooms: 6,
    area: 8200,
    property_type: "villa",
    status: "available",
    primary_image: { image: "/images/property-6.webp" },
    min_stay_months: 12,
  },
  {
    id: "7",
    title: "Mountain View Lodge",
    address: "Aspen",
    city: "Colorado",
    country: "USA",
    description: "Ski-in/ski-out luxury lodge.",
    daily_price: "30666.67",
    monthly_price: "920000.00",
    currency: "ghs",
    bedrooms: 5,
    bathrooms: 5,
    area: 5400,
    property_type: "house",
    status: "available",
    primary_image: { image: "/images/property-7.webp" },
    min_stay_months: 24,
  },
  {
    id: "8",
    title: "Garden District Home",
    address: "New Orleans",
    city: "LA",
    country: "USA",
    description: "Historic charm with modern updates.",
    daily_price: "18833.33",
    monthly_price: "565000.00",
    currency: "ghs",
    bedrooms: 4,
    bathrooms: 3,
    area: 3200,
    property_type: "house",
    status: "available",
    primary_image: { image: "/images/property-8.webp" },
    min_stay_months: 12,
  },
  {
    id: "9",
    title: "Desert Oasis Estate",
    address: "Scottsdale",
    city: "Arizona",
    country: "USA",
    description: "Contemporary desert estate.",
    daily_price: "36666.67",
    monthly_price: "1100000.00",
    currency: "ghs",
    bedrooms: 5,
    bathrooms: 4,
    area: 4800,
    property_type: "villa",
    status: "available",
    primary_image: { image: "/images/property-9.webp" },
    min_stay_months: 24,
  },
  {
    id: "10",
    title: "Historic Brownstone",
    address: "Brooklyn",
    city: "New York",
    country: "USA",
    description: "Restored brownstone with original details.",
    daily_price: "24500.00",
    monthly_price: "735000.00",
    currency: "ghs",
    bedrooms: 3,
    bathrooms: 3,
    area: 2800,
    property_type: "condo",
    status: "available",
    primary_image: { image: "/images/property-10.webp" },
    min_stay_months: 12,
  },
];

export function getPropertyById(id: string | number): Property | undefined {
  return properties.find((p) => String(p.id) === String(id));
}

export function getOtherProperties(excludeId: string | number, limit = 6): Property[] {
  return properties.filter((p) => String(p.id) !== String(excludeId)).slice(0, limit);
}
