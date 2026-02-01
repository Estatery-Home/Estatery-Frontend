"use client";

import * as React from "react";
import { Link } from "react-router-dom";
import { User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const EMAIL_ERROR_MESSAGE = "The email address you entered is wrong!";
const NAME_REQUIRED_MESSAGE = "Name is required!";
const PASSWORD_REQUIRED_MESSAGE = "Password is required!";

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
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [keepLoggedIn, setKeepLoggedIn] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const hasTyped = name.length > 0 || email.length > 0 || password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    if (!name.trim()) {
      setNameError(NAME_REQUIRED_MESSAGE);
      hasError = true;
    } else {
      setNameError(null);
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

    console.log("Signup attempt", { name, email, password, keepLoggedIn });
    alert("Signup submitted! (Demo – wire to your auth API.)");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) setNameError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  };

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
            <User className="size-7 text-[#0369a1]" strokeWidth={2} />
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
            <Label htmlFor="name" className="text-black">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              className={cn(
                "w-full rounded-lg placeholder:text-[#9ca3af]",
                !nameError && "border-[#d1d5db]",
                nameError && "border-red-500 bg-[#FFE8E8]"
              )}
              autoComplete="name"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
            />
            {nameError && (
              <p
                id="name-error"
                role="alert"
                className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-500" aria-hidden>
                  <AlertCircle className="size-3 stroke-[2.5] text-white [stroke:white]" />
                </span>
                {nameError}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-[#6b7280] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:ring-offset-2"
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
              className="text-sm font-medium text-[#2563eb] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:ring-offset-2 rounded"
            >
              Already have an account?
            </Link>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full rounded-lg text-white",
              (nameError || emailError || passwordError)
                ? "bg-[#1d4ed8] hover:bg-[#1e40af]"
                : hasTyped
                  ? "bg-[#21438D] hover:bg-[#1a3580]"
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
