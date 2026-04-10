/**
 * API client – Admin app API configuration and fetch helpers.
 * Base URL from NEXT_PUBLIC_API_URL (default: http://localhost:8000/api).
 * Provides endpoints object, getAccessToken, apiHeaders, createProperty, fetchPropertiesFromApi.
 */
import type {
  ConversationSummary,
  HostAnalyticsResponse,
  HostCalendarResponse,
  HostClientDetailResponse,
  HostClientsListResponse,
  HostDashboardResponse,
  HostPaymentsListResponse,
  PromoCode,
  PromoCodeCreateInput,
  ThreadMessage,
} from "@/lib/api-types";
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
    passwordResetRequest: `${AUTH_BASE}/password-reset/request/`,
    passwordResetVerifyOtp: `${AUTH_BASE}/password-reset/verify-otp/`,
    passwordResetConfirm: `${AUTH_BASE}/password-reset/confirm/`,
    otpRequest: `${AUTH_BASE}/otp/request/`,
    otpVerify: `${AUTH_BASE}/otp/verify/`,
    /** Properties */
    properties: `${API_BASE}/properties/`,
    propertyDetail: (id: number) => `${API_BASE}/properties/${id}/`,
    myProperties: `${API_BASE}/properties/my/`,
    checkAvailability: (id: number) => `${API_BASE}/properties/${id}/check-availability/`,
    propertyCalendar: (id: number) => `${API_BASE}/properties/${id}/calendar/`,
    propertyReviews: (id: number) => `${API_BASE}/properties/${id}/reviews/`,
    currencies: `${API_BASE}/currencies/`,
    languages: `${API_BASE}/languages/`,
    timezones: `${API_BASE}/timezones/`,
    /** Bookings */
    bookings: `${API_BASE}/bookings/`,
    myBookings: `${API_BASE}/bookings/my/`,
    bookingDetail: (id: number) => `${API_BASE}/bookings/${id}/`,
    bookingPayments: (id: number) => `${API_BASE}/bookings/${id}/payments/`,
    createReview: (bookingId: number) => `${API_BASE}/bookings/${bookingId}/review/`,
    /** Host */
    hostBookings: `${API_BASE}/host/bookings/`,
    hostConfirmBooking: (id: number) => `${API_BASE}/host/bookings/${id}/confirm/`,
    hostClients: `${API_BASE}/host/clients/`,
    hostClientDetail: (userId: number) => `${API_BASE}/host/clients/${userId}/`,
    hostAnalytics: (range: "7d" | "30d" | "90d") =>
      `${API_BASE}/host/analytics/?range=${encodeURIComponent(range)}`,
    hostCalendar: (start: string, end: string) =>
      `${API_BASE}/host/calendar/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    hostPayments: (limit: number) => `${API_BASE}/host/payments/?limit=${limit}`,
    /** Payments */
    markPaymentPaid: (id: number) => `${API_BASE}/payments/${id}/mark-paid/`,
    /** Reviews */
    reviewRespond: (id: number) => `${API_BASE}/reviews/${id}/respond/`,
    /** Dashboards */
    dashboardHost: `${API_BASE}/dashboard/host/`,
    dashboardTenant: `${API_BASE}/dashboard/tenant/`,
    /** Promo / discounts (admin: staff or user_type admin) */
    adminDiscounts: `${API_BASE}/admin/discounts/`,
    adminDiscountDetail: (id: number) => `${API_BASE}/admin/discounts/${id}/`,
    discountsValidate: `${API_BASE}/discounts/validate/`,
    countries: `${API_BASE}/countries/`,
    customerProperties: `${API_BASE}/customer/properties/`,
    /** 1:1 messaging */
    messagesConversations: `${API_BASE}/messages/conversations/`,
    messagesOpenConversation: `${API_BASE}/messages/conversations/open/`,
    messagesInConversation: (conversationId: number) =>
      `${API_BASE}/messages/conversations/${conversationId}/messages/`,
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

/** Parse DRF-style `detail` string (or first validation message) from JSON error body. */
export function apiDetailFromResponse(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = (data as Record<string, unknown>).detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length > 0 && typeof d[0] === "string") return d[0];
  return undefined;
}

/** First field validation message or detail — for create/patch error toasts. */
export function apiFirstErrorMessage(data: unknown, fallback: string): string {
  const detail = apiDetailFromResponse(data);
  if (detail) return detail;
  if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (k === "detail") continue;
      if (Array.isArray(v) && v.length > 0) return `${k}: ${String(v[0])}`;
      if (typeof v === "string") return `${k}: ${v}`;
    }
  }
  return fallback;
}

/** Optional machine-readable error code from API (e.g. email_not_verified). */
export function apiErrorCode(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const c = (data as Record<string, unknown>).code;
  return typeof c === "string" ? c : undefined;
}

function throwFromPropertyErrorResponse(err: Record<string, unknown>, fallback: string): never {
  const detail = apiDetailFromResponse(err);
  if (detail) throw new Error(detail);
  const firstField = Object.keys(err).find((k) => k !== "detail");
  if (firstField && err[firstField]) {
    const v = err[firstField];
    if (Array.isArray(v) && v[0]) throw new Error(`${firstField}: ${String(v[0])}`);
    if (typeof v === "string") throw new Error(`${firstField}: ${v}`);
  }
  throw new Error(fallback);
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
  const payload: Record<string, unknown> = { ...data };
  if (payload.max_stay_months == null || payload.max_stay_months === 0) {
    delete payload.max_stay_months;
  }
  const res = await fetch(api.endpoints.properties, {
    method: "POST",
    headers: apiHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throwFromPropertyErrorResponse(err, `Failed to create property: ${res.status}`);
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

/** GET /api/properties/my/ — host's listings (authenticated). */
export async function fetchMyPropertiesFromApi(): Promise<unknown[]> {
  const res = await fetch(api.endpoints.myProperties, {
    headers: apiHeaders(true),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

/** GET /api/properties/:id/ — property detail (same serializer fields as list + nested data on GET). */
export async function fetchPropertyFromApi(id: number): Promise<unknown | null> {
  const res = await fetch(api.endpoints.propertyDetail(id), {
    headers: apiHeaders(false),
  });
  if (!res.ok) return null;
  return res.json();
}

/** PATCH /api/properties/:id/ — update listing (owner only). Body matches PropertySerializer writable fields. */
export async function updateProperty(
  id: number,
  data: Record<string, unknown>
): Promise<{ property: Record<string, unknown>; message: string }> {
  const payload: Record<string, unknown> = { ...data };
  if (payload.max_stay_months === "" || payload.max_stay_months === 0) {
    payload.max_stay_months = null;
  }
  const res = await fetch(api.endpoints.propertyDetail(id), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throwFromPropertyErrorResponse(err, `Failed to update property: ${res.status}`);
  }
  return res.json() as Promise<{ property: Record<string, unknown>; message: string }>;
}

/**
 * DELETE /api/properties/:id/ — host soft-removes listing (status maintenance, cancels pending bookings).
 * API returns 204 No Content on success.
 */
export async function deleteProperty(id: number): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(api.endpoints.propertyDetail(id), {
    method: "DELETE",
    headers: apiHeaders(true),
  });
  if (res.status === 204) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      message: apiDetailFromResponse(data) ?? `Request failed (${res.status})`,
    };
  }
  const msg =
    typeof data.message === "string" ? data.message : undefined;
  return { ok: true, message: msg };
}

/** GET /api/host/payments/?limit= — all scheduled booking payments on your properties. */
export async function fetchHostPayments(limit = 500): Promise<HostPaymentsListResponse | null> {
  const res = await fetch(api.endpoints.hostPayments(limit), {
    headers: apiHeaders(true),
  });
  if (!res.ok) return null;
  return res.json() as Promise<HostPaymentsListResponse>;
}

/** GET /api/dashboard/host/ — aggregated host stats, charts, payments. */
export async function fetchHostDashboard(): Promise<HostDashboardResponse | null> {
  const res = await fetch(api.endpoints.dashboardHost, {
    headers: apiHeaders(true),
  });
  if (!res.ok) return null;
  return res.json() as Promise<HostDashboardResponse>;
}

/** PATCH /api/payments/:id/mark-paid/ */
/** GET /api/host/analytics/?range=7d|30d|90d */
export async function fetchHostAnalytics(
  range: "7d" | "30d" | "90d" = "30d"
): Promise<HostAnalyticsResponse | null> {
  const res = await fetch(api.endpoints.hostAnalytics(range), {
    headers: apiHeaders(true),
  });
  if (!res.ok) return null;
  return res.json() as Promise<HostAnalyticsResponse>;
}

/** GET /api/host/calendar/?start=&end= — booking nights on your properties (YYYY-MM-DD, inclusive). */
export async function fetchHostCalendar(
  start: string,
  end: string
): Promise<HostCalendarResponse | null> {
  const res = await fetch(api.endpoints.hostCalendar(start, end), {
    headers: apiHeaders(true),
  });
  if (!res.ok) return null;
  return res.json() as Promise<HostCalendarResponse>;
}

/** GET /api/host/clients/ — tenant customers with bookings on your properties */
export async function fetchHostClients(): Promise<HostClientsListResponse | null> {
  const res = await fetch(api.endpoints.hostClients, { headers: apiHeaders(true) });
  if (!res.ok) return null;
  return res.json() as Promise<HostClientsListResponse>;
}

/** GET /api/host/clients/<user_id>/ — one customer + bookings + payments */
export async function fetchHostClientDetail(
  userId: number
): Promise<HostClientDetailResponse | null> {
  const res = await fetch(api.endpoints.hostClientDetail(userId), {
    headers: apiHeaders(true),
  });
  if (!res.ok) return null;
  return res.json() as Promise<HostClientDetailResponse>;
}

export async function markHostPaymentPaid(
  paymentId: number,
  transactionId?: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(api.endpoints.markPaymentPaid(paymentId), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify({ transaction_id: transactionId ?? "" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: apiDetailFromResponse(data) ?? `Request failed (${res.status})`,
    };
  }
  return { ok: true, message: (data as { message?: string }).message };
}

/** GET /api/admin/discounts/ — staff or user_type admin */
export async function fetchAdminDiscounts(): Promise<PromoCode[] | null> {
  const res = await fetch(api.endpoints.adminDiscounts, { headers: apiHeaders(true) });
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data)) return data as PromoCode[];
  const r = (data as { results?: PromoCode[] })?.results;
  if (Array.isArray(r)) return r;
  return [];
}

/** POST /api/admin/discounts/ */
export async function createAdminDiscount(
  body: PromoCodeCreateInput
): Promise<{ ok: true; promo: PromoCode } | { ok: false; message: string }> {
  const res = await fetch(api.endpoints.adminDiscounts, {
    method: "POST",
    headers: apiHeaders(true),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: apiFirstErrorMessage(data, `Request failed (${res.status})`),
    };
  }
  return { ok: true, promo: data as PromoCode };
}

/** PATCH /api/admin/discounts/:id/ */
export async function patchAdminDiscount(
  id: number,
  body: Partial<PromoCodeCreateInput> & { is_active?: boolean }
): Promise<{ ok: true; promo: PromoCode } | { ok: false; message: string }> {
  const res = await fetch(api.endpoints.adminDiscountDetail(id), {
    method: "PATCH",
    headers: apiHeaders(true),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: apiFirstErrorMessage(data, `Request failed (${res.status})`),
    };
  }
  return { ok: true, promo: data as PromoCode };
}

/** DELETE /api/admin/discounts/:id/ */
export async function deleteAdminDiscount(id: number): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(api.endpoints.adminDiscountDetail(id), {
    method: "DELETE",
    headers: apiHeaders(true),
  });
  if (res.status === 204) return { ok: true };
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      message: apiFirstErrorMessage(data, `Request failed (${res.status})`),
    };
  }
  return { ok: true };
}

/** GET /api/messages/conversations/ */
export async function fetchMessageConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(api.endpoints.messagesConversations, { headers: apiHeaders(true) });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

/** POST open conversation with another user by id */
export async function openMessageConversation(
  userId: number
): Promise<{ conversation: ConversationSummary }> {
  const res = await fetch(api.endpoints.messagesOpenConversation, {
    method: "POST",
    headers: apiHeaders(true),
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiDetailFromResponse(data) ?? `Open conversation failed (${res.status})`);
  }
  return data as { conversation: ConversationSummary };
}

/** GET messages in a thread */
export async function fetchConversationMessages(conversationId: number): Promise<ThreadMessage[]> {
  const res = await fetch(api.endpoints.messagesInConversation(conversationId), {
    headers: apiHeaders(true),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** POST a text message */
export async function postConversationMessage(
  conversationId: number,
  body: string
): Promise<ThreadMessage> {
  const res = await fetch(api.endpoints.messagesInConversation(conversationId), {
    method: "POST",
    headers: apiHeaders(true),
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(apiDetailFromResponse(data) ?? `Send failed (${res.status})`);
  }
  const msg = (data as { message_obj?: ThreadMessage }).message_obj;
  if (!msg) throw new Error("Invalid response from server");
  return msg;
}
