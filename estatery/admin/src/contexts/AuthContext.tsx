"use client";

/**
 * AuthContext – Authentication via backend API.
 * Login/register call POST /api/auth/login/ and /api/auth/register/.
 * Token stored in estatery-access (used by api-client), user in estatery-user.
 */
import * as React from "react";
import { api, apiHeaders } from "@/lib/api-client";
import type { User, AuthResponse } from "@/lib/api-types";


// AuthContextValue to be used in the app to access the auth context values  
type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { username: string; email: string; password: string; user_type: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

// AuthContext to be used in the app to access the auth context values 
const AuthContext = React.createContext<AuthContextValue | null>(null);

// AUTH_KEY to be used in the app to store the authentication token
const AUTH_KEY = "estatery-access";
// USER_KEY to be used in the app to store the user data
const USER_KEY = "estatery-user";

/** Read user and token from localStorage. Returns null if missing or invalid. */
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

// AuthProvider to be used in the app to provide the auth context values to the app and to access the auth context values in the app
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

  // Login function to be used in the app to login the user with the backend API and display the error message to the user if the login fails
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
        // Login failed with error message to be displayed to the user if the login fails
        if (!res.ok) {
          const msg =
            (data.username as string[])?.[0] ??
            (data.detail as string) ??
            (data.message as string) ??
            "Login failed, your username or password is incorrect, please try again";
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


// Register function to be used in the app to register the user with the backend API and display the error message to the user if the registration fails
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
        // Registration failed with error message to be displayed to the user if the registration fails 
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
        // Signup success – do NOT log in; user must go to login page to login after registration
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

// Logout function to be used in the app to logout the user
  const logout = React.useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("estatery-user-profile");
    } catch {}
  }, []);

  // Change password function to be used in the app to change the password
  const changePassword = React.useCallback(async (currentPassword: string, newPassword: string) => {
    // TODO: wire to backend change-password when available
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("estatery-password", newPassword);
      }
    } catch {} 
  }, []);
// AuthContextValue provider to be used in the app to access the auth context values 
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
