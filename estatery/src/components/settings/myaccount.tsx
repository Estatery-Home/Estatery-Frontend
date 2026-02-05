"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { UserProfile } from "@/contexts/UserProfileContext";

type MyAccountProps = {
  /** When provided, form works in "draft" mode for Settings save/cancel. */
  draft?: UserProfile;
  onUpdateDraft?: (partial: Partial<UserProfile>) => void;
};

export function MyAccount({ draft: draftProp, onUpdateDraft }: MyAccountProps) {
  const { profile, updateProfile } = useUserProfile();
  const draft = draftProp ?? profile;
  const update = onUpdateDraft ?? updateProfile;

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        update({ avatar: result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-0">
      <section className="flex flex-col gap-6 pb-10 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-56 lg:w-64">
          <h3 className="text-lg font-bold text-[#1e293b]">Account Setting</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            View and update your account details, profile, and more.
          </p>
        </div>
        <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 ">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--logo-muted)] text-lg font-semibold text-[var(--logo)]">
              {draft.avatar ? (
                <img src={draft.avatar} alt="" className="size-full object-cover" />
              ) : (
                <span>{draft.name?.slice(0, 1) ?? "U"}</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#1e293b]">{draft.name}</p>
              <button
                type="button"
                className="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[var(--logo)] hover:bg-[var(--logo-muted)]"
              >
                <label className="cursor-pointer">
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-[#1e293b]">
              Full Name <span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="full-name"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#1e293b]">
              Email Address<span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={draft.email}
              onChange={(e) => update({ email: e.target.value })}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[#1e293b]">
              Phone Number<span className="text-[#dc2626]">*</span>
            </Label>
            <Input
              id="phone"
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value })}
              className="border-[#e2e8f0] bg-white text-[#1e293b]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
