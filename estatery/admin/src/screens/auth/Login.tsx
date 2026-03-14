/**
 * Login – Admin login page.
 * Split layout: LoginForm on left, LoginHero (image/branding) on right.
 * Wrapped by PublicRoute which redirects to dashboard if user is already authenticated.
 */
import { LoginForm } from "@/components/auth";
import { LoginHero } from "@/components/auth";

export default function Login() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      {/* Left: Login form (username, password, submit) */}
      <LoginForm />
      {/* Right: Hero section with branding/image (hidden on mobile) */}
      <LoginHero />
    </main>
  );
}
