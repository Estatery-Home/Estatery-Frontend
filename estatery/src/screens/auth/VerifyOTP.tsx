"use client";

import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCardHeader, AuthCardFooter } from "@/components/auth/AuthCardLayout";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 5;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "johndoe@example.com";

  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendSeconds, setResendSeconds] = React.useState(37);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;
    navigate("/auth/forgotPassword", { state: { email } });
  };

  const resend = () => {
    if (resendSeconds > 0) return;
    setResendSeconds(37);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <AuthCardHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-[#E8F4FC] shadow-sm">
              <Mail className="size-8 text-[#21438D]" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold text-[#1e293b]">
            OTP Verification
          </h1>
          <p className="mt-2 text-center text-sm text-[#64748b]">
            We have sent a verification code to email address{" "}
            <span className="font-medium text-[#1e293b]">{email}</span>
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    "h-12 w-11 rounded-lg border bg-white text-center text-lg font-semibold transition-colors",
                    "border-[#d1d5db] focus:border-[#21438D] focus:ring-2 focus:ring-[#21438D]/20 focus:outline-none"
                  )}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg bg-[#21438D] text-white hover:bg-[#1a3580]"
              size="lg"
            >
              Verify
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">
            <button
              type="button"
              onClick={resend}
              disabled={resendSeconds > 0}
              className="font-medium text-[#1e293b] disabled:opacity-70 hover:underline disabled:no-underline"
            >
              Resend code
            </button>
            {resendSeconds > 0 && (
              <span className="ml-1 font-medium text-[#21438D]">
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
