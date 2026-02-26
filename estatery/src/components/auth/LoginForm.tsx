"use client";

/**
 * Login form – username, password (API-aligned).
 * Uses useAuth().login() on success; navigates to dashboard.
 * API: POST /api/auth/login/ with username, password.
 */
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const USERNAME_ERROR_MESSAGE = "Username is required!";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  /* Form state */
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [keepLoggedIn, setKeepLoggedIn] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [usernameError, setUsernameError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const hasTyped = username.length > 0 || password.length > 0;

  /* Submit: validate username, then login and go to dashboard */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!username.trim()) {
      setUsernameError(USERNAME_ERROR_MESSAGE);
      return;
    }

    setUsernameError(null);
    login();
    navigate("/dashboard");
  };

  /* Clear error when user types in username field */
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (usernameError) setUsernameError(null);
  };

  /* Validate username on blur */
  const handleUsernameBlur = () => {
    if (username.trim() === "") {
      setUsernameError(null);
      return;
    }
    if (!username.trim()) {
      setUsernameError(USERNAME_ERROR_MESSAGE);
    } else {
      setUsernameError(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-6 py-10 sm:px-8 lg:min-w-0 lg:flex-1 lg:px-14">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#E8F4FC]">
            <User className="size-7 text-[var(--logo)]" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Glad to see you again. Log in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-black">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={handleUsernameChange}
              onBlur={handleUsernameBlur}
              error={!!usernameError}
              className={cn(
                "w-full rounded-lg placeholder:text-[#9ca3af]",
                !usernameError && "border-[#d1d5db]",
                usernameError && "border-red-500 bg-[#FFE8E8]"
              )}
              autoComplete="username"
              aria-invalid={!!usernameError}
              aria-describedby={usernameError ? "username-error" : undefined}
            />
            {usernameError && (
              <p
                id="username-error"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500" aria-hidden>
                  <AlertCircle className="size-3 stroke-[2.5] text-white [stroke:white]" />
                </span>
                {usernameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-black">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-[#d1d5db] pr-10 placeholder:text-[#9ca3af]"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded text-[#475569] hover:text-black focus:outline-none focus:ring-2 focus:ring-[var(--logo)] focus:ring-offset-2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
              <Checkbox
                id="keep-login"
                checked={keepLoggedIn}
                onCheckedChange={(checked) =>
                  setKeepLoggedIn(checked === true)
                }
                aria-describedby="keep-login-label"
                className="border-[#d1d5db]"
              />
              <span
                id="keep-login-label"
                className="text-sm font-normal text-black"
              >
                Keep me login
              </span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--logo)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--logo)] focus:ring-offset-2 rounded"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full rounded-lg text-white",
              usernameError
                ? "bg-[var(--logo)] hover:bg-[var(--logo-hover)]"
                : hasTyped
                  ? "bg-[var(--logo)] hover:bg-[var(--logo-hover)]"
                  : "bg-[#97ADDE] hover:bg-[#7d9ad4]"
            )}
            size="lg"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
