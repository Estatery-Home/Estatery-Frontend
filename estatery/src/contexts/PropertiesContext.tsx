"use client";

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
  getPropertyById: (id: string) => Property | undefined;
  getOtherProperties: (excludeId: string, limit?: number) => Property[];
};

const PropertiesContext = React.createContext<PropertiesContextValue | null>(null);

function generateId(): string {
  return String(Date.now()).slice(-5);
}

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = React.useState<Property[]>(initialProperties);

  React.useEffect(() => {
    setProperties(loadProperties());
  }, []);

  React.useEffect(() => {
    saveProperties(properties);
  }, [properties]);

  const addProperty = React.useCallback((property: Omit<Property, "id">) => {
    const id = generateId();
    const newProperty: Property = {
      ...property,
      id,
    };
    setProperties((prev) => [newProperty, ...prev]);
  }, []);

  const getPropertyById = React.useCallback(
    (id: string) => properties.find((p) => p.id === id),
    [properties]
  );

  const getOtherProperties = React.useCallback(
    (excludeId: string, limit = 6) =>
      properties.filter((p) => p.id !== excludeId).slice(0, limit),
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
