/**
 * NotFound – 404 page shown when user visits an unknown route.
 * Displays error message and a link to return to the login page.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f1f5f9] px-4 py-8 text-center font-sans antialiased">
      <h1 className="text-4xl font-bold text-[#1e293b]">404</h1>
      <p className="mt-2 text-sm text-[#64748b]">Page not found.</p>
      <Link
        to="/auth/login"
        className="mt-6 text-sm font-medium text-[var(--logo)] hover:text-[var(--logo-hover)] hover:underline"
      >
        Go to Login
      </Link>
    </main>
  );
}
