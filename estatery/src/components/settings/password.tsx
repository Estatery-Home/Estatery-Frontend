"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordDraft = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordProps = {
  draft: PasswordDraft;
  onUpdateDraft: (partial: Partial<PasswordDraft>) => void;
};

export function Password({ draft, onUpdateDraft }: PasswordProps) {
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#1e293b]">Password</h3>
        <p className="mt-1 text-sm text-[#64748b]">Change or view your password</p>
      </div>

      <section className="flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="min-w-0 flex-1 space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-[#1e293b]">
              Current Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={draft.currentPassword}
                onChange={(e) => onUpdateDraft({ currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="pr-10 border-[#e2e8f0] bg-white text-[#1e293b]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded text-[#64748b] hover:text-[#1e293b]"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-[#1e293b]">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={draft.newPassword}
                onChange={(e) => onUpdateDraft({ newPassword: e.target.value })}
                placeholder="Enter new password"
                className="pr-10 border-[#e2e8f0] bg-white text-[#1e293b]"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded text-[#64748b] hover:text-[#1e293b]"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className={cn("text-xs", draft.newPassword && draft.newPassword.length < 8 ? "text-red-500" : "text-[#64748b]")}>
              Must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-[#1e293b]">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={draft.confirmPassword ?? ""}
                onChange={(e) => onUpdateDraft({ confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="pr-10 border-[#e2e8f0] bg-white text-[#1e293b]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-2 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded text-[#64748b] hover:text-[#1e293b]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {draft.newPassword && draft.confirmPassword && draft.newPassword !== draft.confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
