"use client";

/**
 * OTP – password reset: POST password-reset/verify-otp/ → reset_token → new password.
 * Email verification: POST otp/verify/ purpose verify_email. Backend uses 6-digit codes.
 */
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCardHeader, AuthCardFooter } from "@/components/auth/AuthCardLayout";
import { cn } from "@/lib/utils";
import { api, apiDetailFromResponse, apiHeaders } from "@/lib/api-client";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

type AuthFlow = "password_reset" | "verify_email";
type LocationState = { email?: string; flow?: AuthFlow };

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const email = state.email?.trim() ?? "";
  const flow: AuthFlow = state.flow === "verify_email" ? "verify_email" : "password_reset";

  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendSeconds, setResendSeconds] = React.useState(RESEND_COOLDOWN_SEC);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendBusy, setResendBusy] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (!email) navigate("/auth/forgot-password", { replace: true });
  }, [email, navigate]);

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtp(next);
      const focusIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH || !email) return;
    setError(null);
    setLoading(true);
    try {
      if (flow === "password_reset") {
        const res = await fetch(api.endpoints.passwordResetVerifyOtp, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({ email, otp: code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(apiDetailFromResponse(data) ?? "Invalid or expired code.");
          return;
        }
        const resetToken = (data as { reset_token?: string }).reset_token;
        if (!resetToken) {
          setError("Missing reset token. Try again.");
          return;
        }
        navigate("/auth/create-new-password", { state: { resetToken } });
        return;
      }

      const res = await fetch(api.endpoints.otpVerify, {
        method: "POST",
        headers: apiHeaders(false),
        body: JSON.stringify({ email, otp: code, purpose: "verify_email" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetailFromResponse(data) ?? "Invalid or expired code.");
        return;
      }
      navigate("/auth/login", {
        replace: true,
        state: { bannerMessage: "Email verified. You can sign in." },
      });
    } catch {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendSeconds > 0 || !email || resendBusy) return;
    setResendBusy(true);
    setError(null);
    try {
      if (flow === "password_reset") {
        const res = await fetch(api.endpoints.passwordResetRequest, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(apiDetailFromResponse(data) ?? "Could not resend code.");
          return;
        }
      } else {
        const res = await fetch(api.endpoints.otpRequest, {
          method: "POST",
          headers: apiHeaders(false),
          body: JSON.stringify({ email, purpose: "verify_email" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(apiDetailFromResponse(data) ?? "Could not resend code.");
          return;
        }
      }
      setResendSeconds(RESEND_COOLDOWN_SEC);
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setResendBusy(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <AuthCardHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-[#E8F4FC] shadow-sm">
              <Mail className="size-8 text-[var(--logo)]" />
            </div>
          </div>
          <h1 className="text-center text-xl font-bold text-[#1e293b]">
            {flow === "verify_email" ? "Verify your email" : "Enter verification code"}
          </h1>
          <p className="mt-2 text-center text-sm text-[#64748b]">
            We sent a {OTP_LENGTH}-digit code to{" "}
            <span className="font-medium text-[#1e293b]">{email}</span>
          </p>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
            )}
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    "h-12 w-9 rounded-lg border bg-white text-center text-lg font-semibold transition-colors sm:w-10",
                    "border-[#d1d5db] focus:border-[var(--logo)] focus:ring-2 focus:ring-[var(--logo)]/20 focus:outline-none"
                  )}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <Button
              type="submit"
              disabled={loading || otp.join("").length !== OTP_LENGTH}
              className="w-full rounded-lg bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
              size="lg"
            >
              {loading ? "Verifying…" : flow === "verify_email" ? "Verify email" : "Continue"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">
            <button
              type="button"
              onClick={() => void resend()}
              disabled={resendSeconds > 0 || resendBusy}
              className="font-medium text-[#1e293b] disabled:opacity-70 hover:underline disabled:no-underline"
            >
              Resend code
            </button>
            {resendSeconds > 0 && (
              <span className="ml-1 font-medium text-[var(--logo)]">
                in 00:{String(resendSeconds).padStart(2, "0")}
              </span>
            )}
          </p>
        </div>
      </main>
      <AuthCardFooter />
    </div>
  );
}
