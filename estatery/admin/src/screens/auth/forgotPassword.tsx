"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCardHeader, AuthCardFooter } from "@/components/auth/AuthCardLayout";
import { api, apiDetailFromResponse, apiErrorCode, apiHeaders } from "@/lib/api-client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notVerified, setNotVerified] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setError(null);
    setNotVerified(false);
    setLoading(true);
    try {
      const res = await fetch(api.endpoints.passwordResetRequest, {
        method: "POST",
        headers: apiHeaders(false),
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && apiErrorCode(data) === "email_not_verified") {
        setNotVerified(true);
        setError(apiDetailFromResponse(data) ?? "Please verify your email first.");
        return;
      }
      if (!res.ok) {
        setError(apiDetailFromResponse(data) ?? "Something went wrong. Try again.");
        return;
      }
      navigate("/auth/verify-otp", {
        state: { email: trimmed, flow: "password_reset" as const },
      });
    } catch {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const goVerifyEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    navigate("/auth/verify-otp", { state: { email: trimmed, flow: "verify_email" as const } });
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
          <h1 className="text-center text-xl font-bold text-[#1e293b]">Forgot Password</h1>
          <p className="mt-2 text-center text-sm text-[#64748b]">
            We&apos;ll email a verification code. You must have a verified email on your account to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {notVerified && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p className="font-medium">Email not verified</p>
                <button
                  type="button"
                  onClick={goVerifyEmail}
                  className="mt-2 font-semibold text-[var(--logo)] underline hover:no-underline"
                >
                  Enter the code we sent when you signed up (or resend)
                </button>
              </div>
            )}
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
                className="w-full rounded-lg border-[#d1d5db] bg-white text-black placeholder:text-[#1e293b]"
                autoComplete="email"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
              size="lg"
            >
              {loading ? "Sending..." : "Send code"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">
            Remember your password?{" "}
            <Link to="/auth/login" className="font-medium text-[var(--logo)] underline hover:no-underline">
              Back to login
            </Link>
          </p>
        </div>
      </main>
      <AuthCardFooter />
    </div>
  );
}
