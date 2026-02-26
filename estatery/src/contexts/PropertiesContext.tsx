"use client";

/**
 * PropertiesContext – Global property list state.
 *
 * Loads/saves properties from localStorage. Provides addProperty,
 * getPropertyById, getOtherProperties for use across the app.
 */
import * as React from "react";
import { properties as initialProperties } from "@/lib/properties";
import type { Property } from "@/lib/properties";

const STORAGE_KEY = "estatery-properties";

function loadProperties(): Property[] {
  if (typeof window === "undefined") return initialProperties;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProperties;
    const parsed = JSON.parse(raw) as Property[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialProperties;
  } catch {
    return initialProperties;
  }
}

function saveProperties(props: Property[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
  } catch {
    // ignore
  }
}

type PropertiesContextValue = {
  properties: Property[];
  addProperty: (property: Omit<Property, "id">) => void;
  getPropertyById: (id: string | number) => Property | undefined;
  getOtherProperties: (excludeId: string | number, limit?: number) => Property[];
};

const PropertiesContext = React.createContext<PropertiesContextValue | null>(null);

function generateId(): string {
  return String(Date.now()).slice(-5);
}

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = React.useState<Property[]>(initialProperties);

  /* Load from localStorage on mount */
  React.useEffect(() => {
    setProperties(loadProperties());
  }, []);

  /* Persist to localStorage whenever properties change */
  React.useEffect(() => {
    saveProperties(properties);
  }, [properties]);

  /* Add new property with auto-generated ID, prepend to list */
  const addProperty = React.useCallback((property: Omit<Property, "id">) => {
    const id = generateId();
    const newProperty: Property = {
      ...property,
      id,
    };
    setProperties((prev) => [newProperty, ...prev]);
  }, []);

  const getPropertyById = React.useCallback(
    (id: string | number) => properties.find((p) => String(p.id) === String(id)),
    [properties]
  );

  const getOtherProperties = React.useCallback(
    (excludeId: string | number, limit = 6) =>
      properties.filter((p) => String(p.id) !== String(excludeId)).slice(0, limit),
    [properties]
  );

  const value = React.useMemo(
    () => ({
      properties,
      addProperty,
      getPropertyById,
      getOtherProperties,
    }),
    [properties, addProperty, getPropertyById, getOtherProperties]
  );

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties(): PropertiesContextValue {
  const ctx = React.useContext(PropertiesContext);
  if (!ctx) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return ctx;
}
