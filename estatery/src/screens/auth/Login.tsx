import { LoginForm } from "@/components/auth";
import { LoginHero } from "@/components/auth";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      <LoginForm />
      <LoginHero />
    </div>
  );
}
