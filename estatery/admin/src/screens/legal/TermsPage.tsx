"use client";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HomeTermsPrivacyContent } from "@/components/legal/HomeTermsPrivacyContent";

/** Public page — Terms & Conditions and Privacy Policy */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/auth/Signup"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--logo)] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to sign up
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <HomeTermsPrivacyContent />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/auth/login" className="text-[var(--logo)] hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link to="/auth/Signup" className="text-[var(--logo)] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
