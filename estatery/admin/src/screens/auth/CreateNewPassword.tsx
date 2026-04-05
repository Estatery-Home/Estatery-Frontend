"use client";

/**
 * Create New Password – POST /api/auth/password-reset/confirm/ with reset_token from verify-otp.
 */
import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCardHeader, AuthCardFooter } from "@/components/auth/AuthCardLayout";
import { cn } from "@/lib/utils";
import { api, apiDetailFromResponse, apiHeaders } from "@/lib/api-client";

type LocationState = { resetToken?: string };

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetToken } = (location.state ?? {}) as LocationState;

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!resetToken) {
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetToken) return;
    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(api.endpoints.passwordResetConfirm, {
        method: "POST",
        headers: apiHeaders(false),
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetailFromResponse(data) ?? "Could not reset password. Request a new code.");
        return;
      }
      navigate("/auth/login", {
        replace: true,
        state: { bannerMessage: "Password updated. Sign in with your new password." },
      });
    } catch {
      setError("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <AuthCardHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-[#E8F4FC] shadow-sm">
              <Lock className="size-8 text-[var(--logo)]" />
            </div>
          </div>
          <h1 className="text-center text-xl font-bold text-[#1e293b]">
            Create New Password
          </h1>
          <p className="mt-2 text-center text-sm text-[#64748b]">
            Enter a new password for your account. It will be saved on the server.
          </p>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[#1e293b]">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border-[#93c5fd] pr-10 placeholder:text-[#9ca3af] bg-white text-black",
                    error && "border-red-500"
                  )}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e293b]"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[#1e293b]">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border-[#93c5fd] pr-10 placeholder:text-[#9ca3af] bg-white text-black",
                    error && "border-red-500"
                  )}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e293b]"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
              size="lg"
            >
              {loading ? "Saving…" : "Reset Password"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#64748b]">
            <Link to="/auth/login" className="font-medium text-[var(--logo)] underline hover:no-underline">
              Back to Login
            </Link>
          </p>
        </div>
      </main>
      <AuthCardFooter />
    </div>
  );
}
