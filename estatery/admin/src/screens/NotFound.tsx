/**
 * NotFound – 404 page shown when user visits an unknown route.
 * Displays error message and a link to return to the login page.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Large 404 heading */}
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      {/* Short message explaining the error */}
      <p className="mt-2 text-muted-foreground">Page not found.</p>
      {/* Link to redirect user back to login page */}
      <Link
        to="/auth/login"
        className="mt-6 text-sm font-medium text-[#0ea5e9] hover:underline"
      >
        Go to Login
      </Link>
    </main>
  );
}
