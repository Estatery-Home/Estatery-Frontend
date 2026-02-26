"use client";

/**
 * UserProfileContext – Current user profile (API-aligned).
 * API User: id, username, email, phone, avatar, user_type.
 * Persists to localStorage. Used by settings, top bar, etc.
 */
import * as React from "react";
import type { UserType } from "@/lib/api-types";

export type UserProfile = {
  id?: number;
  username: string;
  email: string;
  phone: string;
  avatar?: string | null;
  user_type: UserType;
};

type UserProfileContextValue = {
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
};

const UserProfileContext = React.createContext<UserProfileContextValue | null>(null);

const STORAGE_KEY = "estatery-user-profile";

function getInitialProfile(): UserProfile {
  const defaultProfile: UserProfile = {
    username: "sarah_lee",
    email: "sarah.lee@example.com",
    phone: "+1 (555) 123-4567",
    avatar: null,
    user_type: "owner",
  };

  if (typeof window === "undefined") return defaultProfile;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as UserProfile;
    return {
      id: parsed.id,
      username: parsed.username || "sarah_lee",
      email: parsed.email || "sarah.lee@example.com",
      phone: parsed.phone || "+1 (555) 123-4567",
      avatar: parsed.avatar ?? null,
      user_type: parsed.user_type || "owner",
    };
  } catch {
    return defaultProfile;
  }
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<UserProfile>(() => getInitialProfile());

  const updateProfile = React.useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      profile,
      updateProfile,
    }),
    [profile, updateProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = React.useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return ctx;
}

