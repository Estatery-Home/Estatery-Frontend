"use client";

/**
 * PropertiesContext – Global property list state.
 *
 * Loads from API when available; falls back to localStorage/seed.
 * Provides addProperty, getPropertyById, getOtherProperties.
 */
import * as React from "react";
import { properties as initialProperties } from "@/lib/properties";
import { fetchPropertiesFromApi } from "@/lib/api-client";
import type { Property } from "@/lib/properties";
import type { PropertyTypeApi, PropertyStatusApi } from "@/lib/api-types";

// STORAGE_KEY to be used in the app to store the properties data
const STORAGE_KEY = "estatery-properties";

/** Load properties from localStorage. Returns empty array if missing or invalid. */
function loadFromStorage(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Property[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist properties to localStorage */
function saveProperties(props: Property[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
  } catch {
    // ignore
  }
}

/** Convert API response object to Property shape. Returns null if invalid. */
function mapApiToProperty(raw: unknown): Property | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  if (Number.isNaN(id)) return null;
  return {
    id,
    title: String(o.title ?? ""),
    address: String(o.address ?? ""),
    city: String(o.city ?? ""),
    country: String(o.country ?? ""),
    description: String(o.description ?? ""),
    daily_price: String(o.daily_price ?? "0"),
    monthly_price: String(o.monthly_price ?? "0"),
    currency: String(o.currency ?? "ghs"),
    bedrooms: Number(o.bedrooms ?? 0),
    bathrooms: Number(o.bathrooms ?? 0),
    area: Number(o.area ?? 0),
    property_type: String(o.property_type ?? "house"),
    listing_type: (o.listing_type as "rent" | "sale") ?? "rent",
    status: String(o.status ?? "available"),
    has_wifi: Boolean(o.has_wifi),
    has_parking: Boolean(o.has_parking),
    has_pool: Boolean(o.has_pool),
    has_gym: Boolean(o.has_gym),
    is_furnished: Boolean(o.is_furnished),
    has_kitchen: Boolean(o.has_kitchen),
    min_stay_months: Number(o.min_stay_months ?? 12),
    primary_image: (o.primary_image as Property["primary_image"]) ?? null,
    images: (o.images as Property["images"]) ?? [],
    created_at: String(o.created_at ?? ""),
    updated_at: String(o.updated_at ?? ""),
  };
}

// PropertiesContextValue to be used in the app to access the properties context values   
type PropertiesContextValue = {
  properties: Property[];
  addProperty: (property: Omit<Property, "id"> | Property) => void;
  getPropertyById: (id: string | number) => Property | undefined;
  getOtherProperties: (excludeId: string | number, limit?: number) => Property[];
};

// PropertiesContext to be used in the app to access the properties context values 
const PropertiesContext = React.createContext<PropertiesContextValue | null>(null);

// generateId to be used in the app to generate a unique id for the property
function generateId(): string {
  return String(Date.now()).slice(-5);
}

// PropertiesProvider to be used in the app to provide the properties context values to the app and to access the properties context values in the app
export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = React.useState<Property[]>(initialProperties);
  const [loaded, setLoaded] = React.useState(false);

  /* Load from API first; fallback to localStorage then seed */
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiData = await fetchPropertiesFromApi();
        if (cancelled) return;
        // Map the API data to the property shape
        const mapped = apiData.map(mapApiToProperty).filter((p): p is Property => p != null);
        if (mapped.length > 0) {
          setProperties(mapped);
          setLoaded(true);
          return;
        }
      } catch {
        // API failed, use fallback
      }
      if (cancelled) return;
      const stored = loadFromStorage();
      setProperties(stored.length > 0 ? stored : initialProperties);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  /* Persist to localStorage whenever properties change (only local adds, not API) */
  React.useEffect(() => {
    if (loaded) saveProperties(properties);
  }, [properties, loaded]);

  /* Add new property (from API with id, or local with generated id), prepend to list */
  const addProperty = React.useCallback((property: Omit<Property, "id"> | Property) => {
    const id = "id" in property && typeof property.id === "number" ? property.id : generateId();
    const newProperty: Property = { ...property, id } as Property;
    setProperties((prev) => [newProperty, ...prev]);
  }, []);

  const getPropertyById = React.useCallback(
    (id: string | number) => properties.find((p) => String(p.id) === String(id)),
    [properties]
  );

  // getOtherProperties to be used in the app to get the other properties except the property with the given id
  const getOtherProperties = React.useCallback(
    (excludeId: string | number, limit = 6) =>
      properties.filter((p) => String(p.id) !== String(excludeId)).slice(0, limit),
    [properties]
  );

  // PropertiesContextValue provider to be used in the app to access the properties context values 
  const value = React.useMemo(
    () => ({
      properties,
      addProperty,
      getPropertyById,
      getOtherProperties,
    }),
    [properties, addProperty, getPropertyById, getOtherProperties]
  );
// PropertiesContextValue provider to be used in the app to access the properties context values 
  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}

// useProperties to be used in the app to access the properties context values 
export function useProperties(): PropertiesContextValue {
  const ctx = React.useContext(PropertiesContext);
  if (!ctx) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return ctx;
}
