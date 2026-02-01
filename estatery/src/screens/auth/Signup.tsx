import { SignupForm } from "@/components/auth/SignupForm";
import { SignupHero } from "@/components/auth/SignupHero";


export default function Signup() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      <SignupForm />
      <SignupHero />
    </div>
  );
}
