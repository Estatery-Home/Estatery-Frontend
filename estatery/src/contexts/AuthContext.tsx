"use client";

/**
 * AuthContext – Authentication via backend API.
 * Login/register call POST /api/auth/login/ and /api/auth/register/.
 * Token stored in estatery-access (used by api-client), user in estatery-user.
 */
import * as React from "react";
import { api, apiHeaders } from "@/lib/api-client";
import type { User, AuthResponse } from "@/lib/api-types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { username: string; email: string; password: string; user_type: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const AUTH_KEY = "estatery-access";
const USER_KEY = "estatery-user";

function getStoredAuth(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!raw || !userRaw) return null;
    const user = JSON.parse(userRaw) as User;
    return { user, token: raw };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const login = React.useCallback(
    async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(api.endpoints.login, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({ username, password }),
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
            "Login failed";
          return { success: false, error: msg };
        }
        const auth = data as AuthResponse;
        setUser(auth.user);
        localStorage.setItem(AUTH_KEY, auth.access);
        localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
        return { success: true };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "";
        const hint = errMsg.includes("fetch") || errMsg.includes("Failed")
          ? "Cannot reach backend. Start it with: npm run dev:backend (or: cd backend/home_backend && python manage.py runserver)"
          : "Network error. Is the backend running at http://localhost:8000?";
        return { success: false, error: hint };
      }
    },
    []
  );

  const register = React.useCallback(
    async (data: { username: string; email: string; password: string; user_type: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
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
            error: fieldErrors || (responseData.detail as string) || "Registration failed",
          };
        }
        // Signup success – do NOT log in; user must go to login page
        return { success: true };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "";
        const hint = errMsg.includes("fetch") || errMsg.includes("Failed")
          ? "Cannot reach backend. Start it with: npm run dev:backend (or: cd backend/home_backend && python manage.py runserver)"
          : "Network error. Is the backend running at http://localhost:8000?";
        return { success: false, error: hint };
      }
    },
    []
  );

  const logout = React.useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("estatery-user-profile");
    } catch {}
  }, []);

  const changePassword = React.useCallback(async (currentPassword: string, newPassword: string) => {
    // TODO: wire to backend change-password when available
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("estatery-password", newPassword);
      }
    } catch {}
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
    }),
    [user, isLoading, login, register, logout, changePassword]
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
