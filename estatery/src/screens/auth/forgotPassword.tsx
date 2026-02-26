"use client";

/**
 * Forgot Password – enter email, navigate to create-new-password.
 */
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCardHeader, AuthCardFooter } from "@/components/auth/AuthCardLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");

  /* Validate email, then navigate to create-new-password with email in state */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    navigate("/auth/create-new-password", { state: { email: email.trim() } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <AuthCardHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-[#dcfce7] shadow-sm">
              <Lock className="size-8 text-[var(--logo)]" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold text-[#1e293b]">
            Forgot Password
          </h1>
          <p className="mt-2 text-center text-sm text-[#64748b]">
            Enter your email address and we&apos;ll send you password reset instructions.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1e293b]">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="johndoe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-[#d1d5db] placeholder:text-[#9ca3af]"
                autoComplete="email"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
              size="lg"
            >
              Forgot Password
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">
            Don&apos;t have access anymore?{" "}
            <Link to="/auth/login" className="font-medium text-[var(--logo)] underline hover:no-underline">
              Try another method
            </Link>
          </p>
        </div>
      </main>
      <AuthCardFooter />
    </div>
  );
}
