/**
 * Bumps a localStorage key so other tabs (e.g. customer site on the same origin) can refetch catalog.
 * Also pair with `cache: 'no-store'` on customer property GETs when origins differ.
 */
export const PROPERTY_CATALOG_BUMP_KEY = "estatery-property-catalog-bump";

export function bumpPropertyCatalogCache(): void {
  try {
    window.localStorage.setItem(PROPERTY_CATALOG_BUMP_KEY, String(Date.now()));
  } catch {
    /* ignore private mode / quota */
  }
}
