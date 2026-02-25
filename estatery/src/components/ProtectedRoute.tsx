"use client";

/**
 * Protects dashboard and other auth-required routes.
 * Redirects to login if not authenticated.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  /* Redirect to login when not authenticated and loading is done */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isAuthenticated, redirectTo, navigate]);

  /* Show nothing until we know auth state; then either redirect or render children */
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
