/**
 * API client – Admin app API configuration and fetch helpers.
 * Base URL from NEXT_PUBLIC_API_URL (default: http://localhost:8000/api).
 * Provides endpoints object, getAccessToken, apiHeaders, createProperty, fetchPropertiesFromApi.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const AUTH_BASE = `${API_BASE.replace(/\/api\/?$/, "")}/api/auth`;

/** All API endpoint URLs – auth, properties, bookings, payments, reviews, dashboards */
export const api = {
  base: API_BASE,
  auth: AUTH_BASE,
  /** Auth endpoints */
  endpoints: {
    register: `${AUTH_BASE}/register/`,
    login: `${AUTH_BASE}/login/`,
    logout: `${AUTH_BASE}/logout/`,
    profile: `${AUTH_BASE}/profile/`,
    refreshToken: `${AUTH_BASE}/token/refresh/`,
    /** Properties */
    properties: `${API_BASE}/properties/`,
    propertyDetail: (id: number) => `${API_BASE}/properties/${id}/`,
    myProperties: `${API_BASE}/properties/my/`,
    checkAvailability: (id: number) => `${API_BASE}/properties/${id}/check-availability/`,
    propertyCalendar: (id: number) => `${API_BASE}/properties/${id}/calendar/`,
    propertyReviews: (id: number) => `${API_BASE}/properties/${id}/reviews/`,
    /** Bookings */
    bookings: `${API_BASE}/bookings/`,
    myBookings: `${API_BASE}/bookings/my/`,
    bookingDetail: (id: number) => `${API_BASE}/bookings/${id}/`,
    bookingPayments: (id: number) => `${API_BASE}/bookings/${id}/payments/`,
    createReview: (bookingId: number) => `${API_BASE}/bookings/${bookingId}/review/`,
    /** Host */
    hostBookings: `${API_BASE}/host/bookings/`,
    hostConfirmBooking: (id: number) => `${API_BASE}/host/bookings/${id}/confirm/`,
    /** Payments */
    markPaymentPaid: (id: number) => `${API_BASE}/payments/${id}/mark-paid/`,
    /** Reviews */
    reviewRespond: (id: number) => `${API_BASE}/reviews/${id}/respond/`,
    /** Dashboards */
    dashboardHost: `${API_BASE}/dashboard/host/`,
    dashboardTenant: `${API_BASE}/dashboard/tenant/`,
  },
};

/** Get JWT access token from localStorage or sessionStorage for Bearer auth */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("estatery-access") ?? sessionStorage.getItem("estatery-access");
}

/** Build fetch headers – Content-Type, Accept, and optionally Authorization Bearer token */
export function apiHeaders(includeAuth = true): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (includeAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** POST new property to API. Requires auth. Returns created property with id. */
export async function createProperty(data: {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  property_type: string;
  listing_type?: "rent" | "sale";
  daily_price: string;
  monthly_price: string;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  min_stay_months?: number;
  max_stay_months?: number;
  monthly_cycle_start?: number;
  security_deposit_months?: number;
  state?: string;
  zip_code?: string;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_pool?: boolean;
  has_gym?: boolean;
  is_furnished?: boolean;
  has_kitchen?: boolean;
}): Promise<{ property: { id: number; [key: string]: unknown }; message: string }> {
  const res = await fetch(api.endpoints.properties, {
    method: "POST",
    headers: apiHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Failed to create property: ${res.status}`);
  }
  return res.json();
}

/** GET all available properties from API. Returns array or empty on error. */
export async function fetchPropertiesFromApi(): Promise<unknown[]> {
  const res = await fetch(`${api.endpoints.properties}?status=available`, {
    headers: apiHeaders(false),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}
