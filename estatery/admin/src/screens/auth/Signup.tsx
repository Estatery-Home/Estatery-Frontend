/**
 * Signup – Admin registration page.
 * Same layout pattern as Login: form on left, hero on right.
 * SignupForm collects username, email, password, phone and sends user_type: "admin".
 */
import { SignupForm } from "@/components/auth/SignupForm";
import { SignupHero } from "@/components/auth/SignupHero";

export default function Signup() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      {/* Left: Registration form */}
      <SignupForm />
      {/* Right: Hero section with branding */}
      <SignupHero />
    </main>
  );
}
