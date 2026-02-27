import Image from "next/image";
import {LoginForm} from "@/components/auth/loginForm";
import { LoginHero } from "@/components/auth/loginHero";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-white lg:flex-row lg:overflow-hidden">
      <LoginForm />
      <LoginHero />
    </main>
  );
}
