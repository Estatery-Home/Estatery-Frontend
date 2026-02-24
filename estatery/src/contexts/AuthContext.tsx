"use client";

import * as React from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  /** True until auth state has been read from storage (client-side). */
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  /** Change password. In production, replace with API call. For demo, persists to storage. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const AUTH_KEY = "estatery-auth";
const PASSWORD_KEY = "estatery-password";

function getStoredAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsAuthenticated(getStoredAuth());
    setIsLoading(false);
  }, []);

  const login = React.useCallback(() => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_KEY, "true");
    } catch {}
  }, []);

  const logout = React.useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(PASSWORD_KEY);
    } catch {}
  }, []);

  const changePassword = React.useCallback(
    async (currentPassword: string, newPassword: string) => {
      //  API call when backend is ready, e.g.:
      // await fetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PASSWORD_KEY, newPassword);
        }
      } catch {
        // ignore
      }
    },
    []
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading, login, logout, changePassword }),
    [isAuthenticated, isLoading, login, logout, changePassword]
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
