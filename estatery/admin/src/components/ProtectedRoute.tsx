"use client";

/**
 * Protects dashboard and other auth-required routes.
 * Redirects to login if not authenticated.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** Where to send unauthenticated users. Default: "/auth/login" */
  redirectTo?: string;
};

/**
 * Wraps protected pages (e.g. dashboard). If the user is not authenticated,
 * redirects to redirectTo. Otherwise renders children.
 */
export default function ProtectedRoute({
  children,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /** Redirect to login when auth check is done and user is not authenticated */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, {
        replace: true,
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      });
    }
  }, [isLoading, isAuthenticated, redirectTo, navigate, location.pathname, location.search, location.hash]);

  /** Show nothing while loading or if not authenticated (redirect will run) */
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
