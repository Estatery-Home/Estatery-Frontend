"use client";

/**
 * Settings page – tabbed sections (General, My Account, Tax, Links, Time/Lang, Password, Notifications).
 * Uses ?section= query param. Saves per section; shows confirmation modal on save.
 */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { General } from "@/components/settings/general";
import { MyAccount } from "@/components/settings/myaccount";
import { Links } from "@/components/settings/links";
import { TimeLang } from "@/components/settings/time_lang";
// import { PaymentBilling } from "@/components/settings/payment-billing"; // TEMP: no payment for now
import { TaxDuties } from "@/components/settings/tax-duties";
import { Password } from "@/components/settings/password";
import { Notifications } from "@/components/settings/notifications";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/contexts/UserProfileContext";

const SETTINGS_NAV = [
  { id: "general", label: "General" },
  { id: "my-account", label: "My Account" },
  // { id: "payment-billing", label: "Payment & Billing" }, // TEMP: no payment for now
  { id: "tax-duties", label: "Tax & Duties" },
  { id: "link-account", label: "Link Account" },
  { id: "time-language", label: "Time & Language" },
  { id: "password", label: "Password" },
  { id: "notifications", label: "Notifications" },
] as const;

function copyProfile(p: UserProfile): UserProfile {
  return {
    id: p.id,
    username: p.username,
    email: p.email,
    phone: p.phone,
    avatar: p.avatar ?? null,
    user_type: p.user_type,
  };
}

const VALID_SECTIONS = ["general", "my-account", /* "payment-billing", */ "tax-duties", "link-account", "time-language", "password", "notifications"];

export default function Settings() {
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const initialSection = sectionParam && VALID_SECTIONS.includes(sectionParam) ? sectionParam : "general";
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const { profile, updateProfile } = useUserProfile();
  const { saveNotifications, saveGeneral, saveLinks, saveTimeLang, /* savePayment, */ saveTax } = useSettings();
  const { changePassword } = useAuth();
  const [draft, setDraft] = useState<UserProfile>(() => copyProfile(profile));
  const [savedSnapshot, setSavedSnapshot] = useState<UserProfile>(() => copyProfile(profile));
  const [passwordDraft, setPasswordDraft] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prevSectionRef = useRef(activeSection);

  /* Reset draft when switching to My Account or Password so we load fresh data */
  useEffect(() => {
    if (activeSection === "my-account" && prevSectionRef.current !== "my-account") {
      setDraft(copyProfile(profile));
      setSavedSnapshot(copyProfile(profile));
    }
    if (activeSection === "password" && prevSectionRef.current !== "password") {
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    prevSectionRef.current = activeSection;
  }, [activeSection, profile]);

  /* Merge partial into My Account draft */
  const handleUpdateDraft = (partial: Partial<UserProfile>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleUpdatePasswordDraft = (partial: Partial<{ currentPassword: string; newPassword: string; confirmPassword: string }>) => {
    setPasswordDraft((prev) => ({ ...prev, ...partial }));
  };

  /* Return validation hint or success message for password section */
  const getPasswordValidationMessage = () => {
    if (!passwordDraft.currentPassword) return "Please enter your current password.";
    if (passwordDraft.newPassword.length < 8) return "New password must be at least 8 characters.";
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) return "New password and confirm password do not match.";
    return "Your changes will be saved.";
  };

  /* Persist current section to storage/context; show success toast and close modal */
  const handleSaveConfirm = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isSaving) return;
    if (activeSection === "password" && !isPasswordValid) return;

    setIsSaving(true);
    try {
      if (activeSection === "general") saveGeneral();
      if (activeSection === "my-account") {
        updateProfile(draft);
        setSavedSnapshot(copyProfile(draft));
      }
      // if (activeSection === "payment-billing") savePayment(); // TEMP: no payment for now
      if (activeSection === "tax-duties") saveTax();
      if (activeSection === "link-account") saveLinks();
      if (activeSection === "time-language") saveTimeLang();
      if (activeSection === "password") {
        await changePassword(passwordDraft.currentPassword, passwordDraft.newPassword);
        setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
      if (activeSection === "notifications") saveNotifications();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setSaveConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isPasswordValid =
    activeSection !== "password" ||
    (!!passwordDraft.currentPassword &&
      passwordDraft.newPassword.length >= 8 &&
      passwordDraft.newPassword === passwordDraft.confirmPassword);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Settings</h1>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-sm font-medium text-green-600">Changes saved</span>
          )}
          <Button
            type="button"
            variant="outline"
            className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
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
          {/* {activeSection === "payment-billing" && <PaymentBilling />} */} {/* TEMP: no payment for now */}
          {activeSection === "tax-duties" && <TaxDuties />}
          {activeSection === "link-account" && <Links />}
          {activeSection === "time-language" && <TimeLang />}
          {activeSection === "password" && (
            <Password draft={passwordDraft} onUpdateDraft={handleUpdatePasswordDraft} />
          )}
          {activeSection === "notifications" && <Notifications />}
        </div>
      </div>

      {/* Save confirmation card - rendered via portal to avoid stacking/click issues */}
      {saveConfirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-confirm-title"
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="save-confirm-title" className="mb-2 text-lg font-semibold text-[#1e293b]">
                Are you sure you want to save changes?
              </h3>
              <p className="mb-6 text-sm text-[#64748b]">
                {activeSection === "password" && !isPasswordValid
                  ? getPasswordValidationMessage()
                  : "Your changes will be saved."}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-[#f8fafc]"
                  onClick={() => setSaveConfirmOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[var(--logo)] text-white hover:bg-[var(--logo-hover)]"
                  onClick={(e) => handleSaveConfirm(e)}
                  disabled={(activeSection === "password" && !isPasswordValid) || isSaving}
                >
                  {isSaving ? "Saving…" : "Confirm"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
