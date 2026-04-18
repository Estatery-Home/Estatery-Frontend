"use client";

/**
 * PropertiesContext – host listings from GET /api/properties/my/.
 */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyPropertiesFromApi, fetchPropertiesFromApi } from "@/lib/api-client";
import type { Property } from "@/lib/properties";
import { propertyFromApiJson } from "@/lib/properties";

const STORAGE_KEY = "estatery-properties";

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
  loading: boolean;
  addProperty: (property: Omit<Property, "id"> | Property) => void;
  getPropertyById: (id: string | number) => Property | undefined;
  getOtherProperties: (excludeId: string | number, limit?: number) => Property[];
  refetchProperties: () => Promise<void>;
  /** Merge one property object from the API (e.g. PATCH response) into the in-memory list. */
  applyPropertyFromApi: (raw: unknown) => void;
};

const PropertiesContext = React.createContext<PropertiesContextValue | null>(null);

function generateId(): string {
  return String(Date.now()).slice(-5);
}

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hydrated, setHydrated] = React.useState(false);

  const loadProperties = React.useCallback(async () => {
    try {
      if (isAuthenticated) {
        const apiData = await fetchMyPropertiesFromApi();
        const mapped = apiData
          .map((raw) => propertyFromApiJson(raw))
          .filter((p): p is Property => p != null);
        setProperties(mapped);
        return;
      }
      const apiData = await fetchPropertiesFromApi();
      const mapped = apiData
        .map((raw) => propertyFromApiJson(raw))
        .filter((p): p is Property => p != null);
      if (mapped.length > 0) {
        setProperties(mapped);
        return;
      }
    } catch {
      /* ignore */
    }
    if (!isAuthenticated) {
      const stored = loadFromStorage();
      setProperties(stored);
    } else {
      setProperties([]);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadProperties();
      if (!cancelled) {
        setHydrated(true);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProperties]);

  React.useEffect(() => {
    if (hydrated && !isAuthenticated) {
      saveProperties(properties);
    }
  }, [properties, hydrated, isAuthenticated]);

  const refetchProperties = React.useCallback(async () => {
    setLoading(true);
    try {
      await loadProperties();
    } finally {
      setLoading(false);
    }
  }, [loadProperties]);

  const applyPropertyFromApi = React.useCallback((raw: unknown) => {
    const p = propertyFromApiJson(raw);
    if (!p) return;
    setProperties((prev) => {
      const i = prev.findIndex((x) => String(x.id) === String(p.id));
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...p };
      return next;
    });
  }, []);

  const addProperty = React.useCallback((property: Omit<Property, "id"> | Property) => {
    const id = "id" in property && typeof property.id === "number" ? property.id : generateId();
    const newProperty: Property = { ...property, id } as Property;
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
      loading,
      addProperty,
      getPropertyById,
      getOtherProperties,
      refetchProperties,
      applyPropertyFromApi,
    }),
    [
      properties,
      loading,
      addProperty,
      getPropertyById,
      getOtherProperties,
      refetchProperties,
      applyPropertyFromApi,
    ]
  );

  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>;
}

export function useProperties(): PropertiesContextValue {
  const ctx = React.useContext(PropertiesContext);
  if (!ctx) {
    throw new Error("useProperties must be used within a PropertiesProvider");
  }
  return ctx;
}
