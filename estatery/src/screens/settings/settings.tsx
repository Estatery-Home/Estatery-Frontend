"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { General } from "@/components/settings/general";
import { MyAccount } from "@/components/settings/myaccount";
import { Links } from "@/components/settings/links";
import { TimeLang } from "@/components/settings/time_lang";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { UserProfile } from "@/contexts/UserProfileContext";

const SETTINGS_NAV = [
  { id: "general", label: "General" },
  { id: "plan-pricing", label: "Plan & Pricing" },
  { id: "my-account", label: "My Account" },
  { id: "payment-billing", label: "Payment & Billing" },
  { id: "tax-duties", label: "Tax & Duties" },
  { id: "link-account", label: "Link Account" },
  { id: "time-language", label: "Time & Language" },
  { id: "password", label: "Password" },
  { id: "notifications", label: "Notifications" },
] as const;

function copyProfile(p: UserProfile): UserProfile {
  return {
    name: p.name,
    role: p.role,
    email: p.email,
    phone: p.phone,
    avatar: p.avatar ?? null,
  };
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string>("general");
  const { profile, updateProfile } = useUserProfile();
  const [draft, setDraft] = useState<UserProfile>(() => copyProfile(profile));
  const [savedSnapshot, setSavedSnapshot] = useState<UserProfile>(() => copyProfile(profile));
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const prevSectionRef = useRef(activeSection);

  // When switching into My Account, sync draft from current profile
  useEffect(() => {
    if (activeSection === "my-account" && prevSectionRef.current !== "my-account") {
      setDraft(copyProfile(profile));
      setSavedSnapshot(copyProfile(profile));
    }
    prevSectionRef.current = activeSection;
  }, [activeSection, profile]);

  const handleUpdateDraft = (partial: Partial<UserProfile>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleSaveConfirm = () => {
    updateProfile(draft);
    setSavedSnapshot(copyProfile(draft));
    setSaveConfirmOpen(false);
  };

  const handleCancelConfirm = () => {
    setDraft(copyProfile(savedSnapshot));
    setCancelConfirmOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Settings</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
            onClick={() => setCancelConfirmOpen(true)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
            onClick={() => setSaveConfirmOpen(true)}
          >
            Save Change
          </Button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm lg:flex-row">
        <nav
          className="w-full shrink-0 border-b border-[#e2e8f0] bg-[#f1f5f9] lg:w-56 lg:border-b-0 lg:border-r lg:border-r-[#e2e8f0]"
          aria-label="Settings sections"
        >
          <ul className="p-2 space-y-0.5">
            {SETTINGS_NAV.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "relative w-full rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--logo-muted)] text-[#1e293b] border-l-[3px] border-l-[var(--logo)] pl-[calc(0.75rem+3px)]"
                        : "text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1e293b]"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 bg-white p-6">
          {activeSection === "general" && <General />}
          {activeSection === "my-account" && (
            <MyAccount draft={draft} onUpdateDraft={handleUpdateDraft} />
          )}
          {activeSection === "link-account" && <Links />}
          {activeSection === "time-language" && <TimeLang />}
        </div>
      </div>

      {/* Save confirmation */}
      {saveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-[#1e293b]">
              Save your changes?
            </h3>
            <p className="mb-6 text-sm text-[#64748b]">
              Are you sure you want to save changes? Your profile will be updated.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                onClick={() => setSaveConfirmOpen(false)}
              >
                No
              </Button>
              <Button
                type="button"
                className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                onClick={handleSaveConfirm}
              >
                Yes, Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-[#1e293b]">
              Discard changes?
            </h3>
            <p className="mb-6 text-sm text-[#64748b]">
              Are you sure you want to cancel? Your unsaved changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                onClick={() => setCancelConfirmOpen(false)}
              >
                No
              </Button>
              <Button
                type="button"
                className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                onClick={handleCancelConfirm}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
