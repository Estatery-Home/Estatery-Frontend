/**
 * API client – base URL and fetch helpers.
 * Set NEXT_PUBLIC_API_URL in .env (e.g. http://localhost:8000/api).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const AUTH_BASE = `${API_BASE.replace(/\/api\/?$/, "")}/api/auth`;

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

/** Get stored access token for Authorization header */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("estatery-access") ?? sessionStorage.getItem("estatery-access");
}

/** Build headers for API requests */
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
