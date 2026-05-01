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
export type AuthStorageKind = "local" | "session";

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
    sessionStorage.removeItem(AUTH_ACCESS_KEY);
    sessionStorage.removeItem(AUTH_REFRESH_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    sessionStorage.removeItem("estatery-user-profile");
  } catch {
    /* ignore */
  }
}

export function touchLastActivity(): void {
  if (typeof window === "undefined") return;
  try {
    const next = String(Date.now());
    const hasLocal = !!localStorage.getItem(AUTH_ACCESS_KEY);
    const hasSession = !!sessionStorage.getItem(AUTH_ACCESS_KEY);
    if (hasLocal) localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, next);
    if (hasSession) sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, next);
    if (!hasLocal && !hasSession) localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, next);
  } catch {
    /* ignore */
  }
}

function readStoredAuthFrom(storage: Storage, kind: AuthStorageKind):
  | { access: string; refresh: string | null; user: User; lastActivity: number | null; storage: AuthStorageKind }
  | null {
  const access = storage.getItem(AUTH_ACCESS_KEY);
  const refresh = storage.getItem(AUTH_REFRESH_KEY);
  const userRaw = storage.getItem(AUTH_USER_KEY);
  const lastRaw = storage.getItem(AUTH_LAST_ACTIVITY_KEY);
  if (!access || !userRaw) return null;
  const user = JSON.parse(userRaw) as User;
  const lastActivity = lastRaw != null && lastRaw !== "" ? parseInt(lastRaw, 10) : null;
  return {
    access,
    refresh,
    user,
    lastActivity: lastActivity != null && !Number.isNaN(lastActivity) ? lastActivity : null,
    storage: kind,
  };
}

export function readStoredAuth():
  | { access: string; refresh: string | null; user: User; lastActivity: number | null; storage: AuthStorageKind }
  | null {
  if (typeof window === "undefined") return null;
  try {
    const local = readStoredAuthFrom(localStorage, "local");
    if (local) return local;
    return readStoredAuthFrom(sessionStorage, "session");
  } catch {
    return null;
  }
}

export function persistAuthSession(args: {
  access: string;
  refresh?: string | null;
  user: User;
  keepLoggedIn: boolean;
}): void {
  if (typeof window === "undefined") return;
  const target = args.keepLoggedIn ? localStorage : sessionStorage;
  const other = args.keepLoggedIn ? sessionStorage : localStorage;
  target.setItem(AUTH_ACCESS_KEY, args.access);
  if (args.refresh) target.setItem(AUTH_REFRESH_KEY, args.refresh);
  else target.removeItem(AUTH_REFRESH_KEY);
  target.setItem(AUTH_USER_KEY, JSON.stringify(args.user));
  target.setItem(AUTH_LAST_ACTIVITY_KEY, String(Date.now()));
  other.removeItem(AUTH_ACCESS_KEY);
  other.removeItem(AUTH_REFRESH_KEY);
  other.removeItem(AUTH_USER_KEY);
  other.removeItem(AUTH_LAST_ACTIVITY_KEY);
}

export function persistRefreshedTokens(
  storage: AuthStorageKind,
  next: { access: string; refresh?: string }
): void {
  if (typeof window === "undefined") return;
  const target = storage === "local" ? localStorage : sessionStorage;
  target.setItem(AUTH_ACCESS_KEY, next.access);
  if (next.refresh) target.setItem(AUTH_REFRESH_KEY, next.refresh);
}

export function persistStoredUser(storage: AuthStorageKind, user: User): void {
  if (typeof window === "undefined") return;
  const target = storage === "local" ? localStorage : sessionStorage;
  target.setItem(AUTH_USER_KEY, JSON.stringify(user));
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
  const stored = readStoredAuth();
  const refresh = stored?.refresh ?? null;
  if (!refresh) return res;
  const next = await refreshAccessToken(refresh);
  if (!next?.access) return res;
  try {
    persistRefreshedTokens(stored?.storage ?? "local", next);
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
