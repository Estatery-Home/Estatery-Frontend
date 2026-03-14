"use client";

/**
 * Public-only routes (login, signup, etc.).
 * Redirects to dashboard if user is already authenticated.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type PublicRouteProps = {
  children: React.ReactNode;
  /** Where to send authenticated users. Default: "/" */
  redirectTo?: string;
};

/**
 * Wraps public-only pages (e.g. login, signup). If the user is authenticated,
 * redirects to redirectTo. Otherwise renders children.
 */
export default function PublicRoute({ children, redirectTo = "/dashboard" }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  /** Redirect to dashboard when auth check is done and user is authenticated */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isAuthenticated, redirectTo, navigate]);

  /** Hide page while loading or if authenticated (redirect will run) */
  if (isLoading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
