"use client";

/**
 * Signup form – username, email, password, user_type, phone (API-aligned).
 * API: POST /api/auth/register/ with username, email, password, user_type, optional phone.
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { UserType } from "@/lib/api-types";

const EMAIL_ERROR_MESSAGE = "The email address you entered is wrong!";
const USERNAME_REQUIRED_MESSAGE = "Username is required!";
const PASSWORD_REQUIRED_MESSAGE = "Password is required!";
const USER_TYPES: { value: UserType; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "owner", label: "Property Owner" },
  { value: "admin", label: "Admin" },
];

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isWrongEmail(email: string): boolean {
  return (
    !email.trim() ||
    !validateEmail(email) ||
    email.toLowerCase().includes("exampple")
  );
}

export function SignupForm() {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [userType, setUserType] = React.useState<UserType>("customer");
  const [keepLoggedIn, setKeepLoggedIn] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [usernameError, setUsernameError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const hasTyped = username.length > 0 || email.length > 0 || password.length > 0;

  /* Validate username, email, password; show errors or submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!username.trim()) {
      setUsernameError(USERNAME_REQUIRED_MESSAGE);
      hasError = true;
    } else {
      setUsernameError(null);
    }

    if (isWrongEmail(email)) {
      setEmailError(EMAIL_ERROR_MESSAGE);
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password.trim()) {
      setPasswordError(PASSWORD_REQUIRED_MESSAGE);
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    console.log("Signup attempt", { username, email, password, user_type: userType, phone, keepLoggedIn });
    alert("Signup submitted! (Demo – wire to your auth API.)");
  };

  /* Clear username error when user types */
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (usernameError) setUsernameError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  };

  /* Validate email on blur; show error only if field has content */
  const handleEmailBlur = () => {
    if (email.trim() === "") {
      setEmailError(null);
      return;
    }
    if (isWrongEmail(email)) {
      setEmailError(EMAIL_ERROR_MESSAGE);
    } else {
      setEmailError(null);
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
            Create New Account
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Enter your details to sign up
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
            <Label htmlFor="email" className="text-black">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              error={!!emailError}
              className={cn(
                "w-full rounded-lg placeholder:text-[#9ca3af]",
                !emailError && "border-[#d1d5db]",
                emailError && "border-red-500 bg-[#FFE8E8]"
              )}
              autoComplete="email"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500" aria-hidden>
                  <AlertCircle className="size-3 stroke-[2.5] text-white [stroke:white]" />
                </span>
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_type" className="text-black">
              Account Type <span className="text-red-500">*</span>
            </Label>
            <select
              id="user_type"
              name="user_type"
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="flex h-10 w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#1e293b] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
            >
              {USER_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-black">
              Phone <span className="text-[#94a3b8]">(optional)</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border-[#d1d5db] placeholder:text-[#9ca3af]"
              autoComplete="tel"
            />
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
                onChange={handlePasswordChange}
                error={!!passwordError}
                className={cn(
                  "w-full rounded-lg pr-10 placeholder:text-[#9ca3af]",
                  !passwordError && "border-[#d1d5db]",
                  passwordError && "border-red-500 bg-[#FFE8E8]"
                )}
                autoComplete="new-password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-[#6b7280] hover:text-black focus:outline-none focus:ring-2 focus:ring-[var(--logo)] focus:ring-offset-2"
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
            {passwordError && (
              <p
                id="password-error"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500" aria-hidden>
                  <AlertCircle className="size-3 stroke-[2.5] text-white [stroke:white]" />
                </span>
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={keepLoggedIn}
                onCheckedChange={(checked) =>
                  setKeepLoggedIn(checked === true)
                }
                aria-describedby="terms-label"
                className="border-[#d1d5db]"
              />
              <Label
                id="terms-label"
                htmlFor="terms"
                className="cursor-pointer text-sm font-normal text-black"
              >
                I agree to the terms
              </Label>
            </div>
            <Link
              to="/auth/login"
              className="text-sm font-medium text-[var(--logo)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--logo)] focus:ring-offset-2 rounded"
            >
              Already have an account?
            </Link>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full rounded-lg text-white",
              (usernameError || emailError || passwordError)
                ? "bg-[var(--logo)] hover:bg-[var(--logo-hover)]"
                : hasTyped
                  ? "bg-[var(--logo)] hover:bg-[var(--logo-hover)]"
                  : "bg-[#97ADDE] hover:bg-[#7d9ad4]"
            )}
            size="lg"
          >
            Register
          </Button>
        </form>
      </div>
    </div>
  );
}
