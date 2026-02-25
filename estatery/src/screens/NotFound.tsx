/**
 * 404 page – shown for unknown routes; link to login.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found.</p>
      <Link
        to="/auth/login"
        className="mt-6 text-sm font-medium text-[#0ea5e9] hover:underline"
      >
        Go to Login
      </Link>
    </main>
  );
}
