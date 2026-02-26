"use client";

/**
 * Modal to confirm logout – Cancel / Yes, Logout.
 * Parent handles actual logout and navigation on confirm.
 */
import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  brandName?: string;
};

export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
  brandName = "Luxeyline",
}: LogoutConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-full bg-[#fda4af]">
            <LogOut className="size-7 text-white" strokeWidth={2} />
          </div>
          <h2
            id="logout-dialog-title"
            className="text-xl font-bold text-[#1e293b]"
          >
            Logout
          </h2>
          <p
            id="logout-dialog-description"
            className="mt-2 text-sm text-[#64748b]"
          >
            Are you sure want to Logout to {brandName}?
          </p>
          <div className="mt-6 flex w-full gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={cn(
                "flex-1 rounded-lg border-[#DFE1E7] bg-white text-[#1e293b]",
                "hover:bg-[#f8fafc] hover:text-[#1e293b]"
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-[#DF1C41] text-white hover:bg-[#b91c1c]"
            >
              Yes, Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
