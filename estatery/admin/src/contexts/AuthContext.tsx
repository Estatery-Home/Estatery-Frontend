"use client";

/**
 * AuthContext – Authentication via backend API.
 * Login stores access + refresh + last-activity. On startup: idle timeout and JWT refresh
 * via POST /api/auth/token/refresh/ so expired access or long idle sends users to login.
 */
import * as React from "react";
import { api, apiHeaders, fetchProfile, getAccessToken } from "@/lib/api-client";
import type { User, AuthResponse } from "@/lib/api-types";
import {
  AUTH_SESSION_EXTENDED_KEY,
  clearAuthStorage,
  getSessionIdleMs,
  isAccessTokenExpired,
  isIdleExceeded,
  persistAuthSession,
  persistRefreshedTokens,
  persistStoredUser,
  readStoredAuth,
  refreshAccessToken,
  setRememberMeSession,
  touchLastActivity,
} from "@/lib/auth-session";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    opts?: { keepLoggedIn?: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    user_type: string;
    phone?: string;
    country?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Reload user from GET /api/auth/profile/ (e.g. after updating social links). */
  refreshUser: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "click"] as const;
const ACTIVITY_THROTTLE_MS = 30_000;
const IDLE_CHECK_INTERVAL_MS = 60_000;
const ADMIN_ALLOWED_ROLES = new Set(["admin", "owner"]);

async function revokeServerSessionBestEffort(stored: ReturnType<typeof readStoredAuth>): Promise<void> {
  if (!stored) return;
  let access = stored.access;
  if (isAccessTokenExpired(access) && stored.refresh) {
    const next = await refreshAccessToken(stored.refresh);
    if (next?.access) access = next.access;
  }
  if (!access) return;
  try {
    await fetch(api.endpoints.logout, {
      method: "POST",
      headers: {
        ...apiHeaders(false),
        Authorization: `Bearer ${access}`,
      },
    });
  } catch {
    /* ignore */
  }
}

async function restoreSession(): Promise<User | null> {
  const stored = readStoredAuth();
  if (!stored) return null;
  if (!ADMIN_ALLOWED_ROLES.has(stored.user?.user_type)) {
    clearAuthStorage();
    return null;
  }
  if (
    stored.storage === "local" &&
    typeof window !== "undefined" &&
    localStorage.getItem(AUTH_SESSION_EXTENDED_KEY) !== "1"
  ) {
    // Backward-compatibility cleanup: previous builds stored all sessions in localStorage.
    // If this local session is not marked "keep me logged in", force fresh login.
    await revokeServerSessionBestEffort(stored);
    clearAuthStorage();
    return null;
  }
  if (stored.lastActivity == null) {
    // Legacy/stale browser sessions without activity tracking should not auto-authenticate.
    clearAuthStorage();
    return null;
  }

  const idleMs = getSessionIdleMs();
  if (isIdleExceeded(stored.lastActivity, idleMs)) {
    clearAuthStorage();
    return null;
  }

  let access = stored.access;
  if (isAccessTokenExpired(access)) {
    if (!stored.refresh) {
      clearAuthStorage();
      return null;
    }
    const next = await refreshAccessToken(stored.refresh);
    if (!next) {
      clearAuthStorage();
      return null;
    }
    access = next.access;
    try {
      persistRefreshedTokens(stored.storage, next);
    } catch {
      clearAuthStorage();
      return null;
    }
  }

  // Always validate the session with backend profile to avoid stale local user/session restores.
  try {
    const liveUser = await fetchProfile();
    if (!liveUser || !ADMIN_ALLOWED_ROLES.has(liveUser.user_type)) {
      clearAuthStorage();
      return null;
    }
    try {
      persistStoredUser(stored.storage, liveUser);
    } catch {
      clearAuthStorage();
      return null;
    }
    touchLastActivity();
    return liveUser;
  } catch {
    clearAuthStorage();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const lastThrottleRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const restored = await restoreSession();
        if (!cancelled) setUser(restored);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Throttled activity → extends idle window while using the app */
  const bumpActivityThrottled = React.useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    touchLastActivity();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const onActivity = () => bumpActivityThrottled();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const stored = readStoredAuth();
        if (stored && isIdleExceeded(stored.lastActivity, getSessionIdleMs())) {
          clearAuthStorage();
          setUser(null);
          return;
        }
        bumpActivityThrottled();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => {
      const stored = readStoredAuth();
      if (!stored) return;
      if (isIdleExceeded(stored.lastActivity, getSessionIdleMs())) {
        clearAuthStorage();
        setUser(null);
      }
    }, IDLE_CHECK_INTERVAL_MS);
    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user, bumpActivityThrottled]);

  const login = React.useCallback(
    async (
      username: string,
      password: string,
      opts?: { keepLoggedIn?: boolean }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(api.endpoints.login, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({
            username,
            password,
            keep_logged_in: Boolean(opts?.keepLoggedIn),
          }),
        });
        let data: Record<string, unknown>;
        try {
          data = (await res.json()) as Record<string, unknown>;
        } catch {
          return {
            success: false,
            error: `Backend error (${res.status}). Is the Django server running? Start it with: npm run dev:backend`,
          };
        }
        if (!res.ok) {
          const msg =
            (data.username as string[])?.[0] ??
            (data.detail as string) ??
            (data.message as string) ??
            "Login failed, your username or password is incorrect, please try again";
          return { success: false, error: msg };
        }
        const auth = data as AuthResponse;
        if (!ADMIN_ALLOWED_ROLES.has(auth.user.user_type)) {
          clearAuthStorage();
          return {
            success: false,
            error: "This account is customer-only. Please use the customer login portal.",
          };
        }
        setUser(auth.user);
        try {
          setRememberMeSession(Boolean(opts?.keepLoggedIn));
          persistAuthSession({
            access: auth.access,
            refresh: auth.refresh,
            user: auth.user,
            keepLoggedIn: Boolean(opts?.keepLoggedIn),
          });
          touchLastActivity();
        } catch {
          clearAuthStorage();
          setUser(null);
          return { success: false, error: "Could not save session in browser storage." };
        }
        return { success: true };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "";
        const hint =
          errMsg.includes("fetch") || errMsg.includes("Failed")
            ? "Cannot reach backend. Start it with: npm run dev:backend (or: cd backend/home_backend && python manage.py runserver)"
            : "Network error. Is the backend running at http://localhost:8000?";
        return { success: false, error: hint };
      }
    },
    []
  );

  const register = React.useCallback(
    async (data: {
      username: string;
      email: string;
      password: string;
      user_type: string;
      phone?: string;
      country?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(api.endpoints.register, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({ ...data, user_type: data.user_type || "customer" }),
        });
        let responseData: Record<string, unknown>;
        try {
          responseData = (await res.json()) as Record<string, unknown>;
        } catch {
          return {
            success: false,
            error: `Backend error (${res.status}). Is the Django server running? Start it with: npm run dev:backend`,
          };
        }
        if (!res.ok) {
          const fieldErrors = Object.entries(responseData)
            .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
            .map(([k, v]) => `${k}: ${(v as string[])[0]}`)
            .join(" ");
          return {
            success: false,
            error: fieldErrors || (responseData.detail as string) || "Registration failed, check your details and try again",
          };
        }
        return { success: true };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "";
        const hint =
          errMsg.includes("fetch") || errMsg.includes("Failed")
            ? "Cannot reach backend. Start it with: npm run dev:backend (or: cd backend/home_backend && python manage.py runserver)"
            : "Network error. Is the backend running at http://localhost:8000?";
        return { success: false, error: hint };
      }
    },
    []
  );

  const refreshUser = React.useCallback(async () => {
    try {
      const u = await fetchProfile();
      if (!u) return;
      setUser(u);
      try {
        const stored = readStoredAuth();
        persistStoredUser(stored?.storage ?? "local", u);
      } catch {
        /* ignore */
      }
    } catch {
      /* keep existing user */
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      if (typeof window !== "undefined" && getAccessToken()) {
        await fetch(api.endpoints.logout, {
          method: "POST",
          headers: apiHeaders(true),
        });
      }
    } catch {
      /* still clear client session if backend is unreachable */
    } finally {
      setUser(null);
      clearAuthStorage();
    }
  }, []);

  const changePassword = React.useCallback(async (currentPassword: string, newPassword: string) => {
    void currentPassword;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("estatery-password", newPassword);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      changePassword,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, changePassword, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
