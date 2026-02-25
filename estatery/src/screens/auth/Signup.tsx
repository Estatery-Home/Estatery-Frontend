/**
 * Signup page – form + hero layout (same pattern as Login).
 */
import { SignupForm } from "@/components/auth/SignupForm";
import { SignupHero } from "@/components/auth/SignupHero";


export default function Signup() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      <SignupForm />
      <SignupHero />
    </main>
  );
}
