"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { HomeTermsPrivacyContent } from "./HomeTermsPrivacyContent";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
};

export function TermsPrivacyModal({ open, onClose, title = "Terms & Conditions and Privacy Policy" }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-dialog-title"
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="terms-dialog-title" className="pr-4 text-base font-semibold text-slate-900 sm:text-lg">
            {title}
          </h2>
          <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:pb-6">
          <HomeTermsPrivacyContent />
        </div>
      </div>
    </div>
  );
}
