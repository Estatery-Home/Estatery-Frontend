/**
 * Client-side session helpers: JWT exp decode, refresh call, idle timeout, storage keys.
 * Works with Django Simple JWT (access + refresh).
 */
import { api, apiHeaders } from "@/lib/api-client";
import type { User } from "@/lib/api-types";

export const AUTH_ACCESS_KEY = "estatery-access";
export const AUTH_REFRESH_KEY = "estatery-refresh";
export const AUTH_USER_KEY = "estatery-user";
export const AUTH_LAST_ACTIVITY_KEY = "estatery-last-activity";
/** Set on login when “Keep me logged in” / “Remember me” — longer idle window + backend refresh lifetime. */
export const AUTH_SESSION_EXTENDED_KEY = "estatery-session-extended";

export function setRememberMeSession(isExtended: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (isExtended) localStorage.setItem(AUTH_SESSION_EXTENDED_KEY, "1");
    else localStorage.removeItem(AUTH_SESSION_EXTENDED_KEY);
  } catch {
    /* ignore */
  }
}

/** Max idle time without interaction before requiring login (ms). Override with NEXT_PUBLIC_SESSION_IDLE_MS */
export function getSessionIdleMs(): number {
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem(AUTH_SESSION_EXTENDED_KEY) === "1") {
        return 30 * 24 * 60 * 60 * 1000;
      }
    } catch {
      /* ignore */
    }
  }
  const raw = process.env.NEXT_PUBLIC_SESSION_IDLE_MS;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 30 * 60 * 1000; // 30 minutes
}

/** Seconds skew before treating access token as expired */
const EXP_SKEW_SEC = 90;

export function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = atob(b64);
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (exp == null) return true;
  return Date.now() / 1000 >= exp - EXP_SKEW_SEC;
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_ACCESS_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    localStorage.removeItem(AUTH_SESSION_EXTENDED_KEY);
    localStorage.removeItem("estatery-user-profile");
  } catch {
    /* ignore */
  }
}

export function touchLastActivity(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function readStoredAuth():
  | { access: string; refresh: string | null; user: User; lastActivity: number | null }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const access = localStorage.getItem(AUTH_ACCESS_KEY);
    const refresh = localStorage.getItem(AUTH_REFRESH_KEY);
    const userRaw = localStorage.getItem(AUTH_USER_KEY);
    const lastRaw = localStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
    if (!access || !userRaw) return null;
    const user = JSON.parse(userRaw) as User;
    const lastActivity =
      lastRaw != null && lastRaw !== "" ? parseInt(lastRaw, 10) : null;
    return {
      access,
      refresh,
      user,
      lastActivity: lastActivity != null && !Number.isNaN(lastActivity) ? lastActivity : null,
    };
  } catch {
    return null;
  }
}

export function isIdleExceeded(lastActivity: number | null, idleMs: number): boolean {
  if (lastActivity == null) return false;
  return Date.now() - lastActivity > idleMs;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access: string; refresh?: string } | null> {
  try {
    const res = await fetch(api.endpoints.refreshToken, {
      method: "POST",
      headers: apiHeaders(false),
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return null;
    return { access: data.access, refresh: data.refresh };
  } catch {
    return null;
  }
}

function mergeRequestHeaders(
  base: HeadersInit,
  extra?: HeadersInit
): Headers {
  const h = new Headers(base);
  if (extra) {
    new Headers(extra).forEach((v, k) => {
      h.set(k, v);
    });
  }
  return h;
}

/**
 * Authenticated fetch: retries once after refreshing the access token on 401.
 * Use for notification polling and other authenticated reads so the bell stays in sync after JWT expiry.
 */
export async function fetchWithAuthRetry(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = mergeRequestHeaders(apiHeaders(true), init.headers);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    // Keep polling code resilient when backend is offline/unreachable.
    return new Response(null, { status: 503, statusText: "Network error" });
  }
  if (res.status !== 401) return res;
  if (typeof window === "undefined") return res;
  const refresh = localStorage.getItem(AUTH_REFRESH_KEY);
  if (!refresh) return res;
  const next = await refreshAccessToken(refresh);
  if (!next?.access) return res;
  try {
    localStorage.setItem(AUTH_ACCESS_KEY, next.access);
    if (next.refresh) localStorage.setItem(AUTH_REFRESH_KEY, next.refresh);
  } catch {
    return res;
  }
  const retryHeaders = mergeRequestHeaders(apiHeaders(true), init.headers);
  try {
    return await fetch(url, { ...init, headers: retryHeaders });
  } catch {
    return new Response(null, { status: 503, statusText: "Network error" });
  }
}
