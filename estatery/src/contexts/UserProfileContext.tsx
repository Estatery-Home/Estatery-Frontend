"use client";

/**
 * UserProfileContext – Current user profile (API-aligned).
 * Synced with AuthContext when user is logged in.
 * Falls back to localStorage when no auth user.
 */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
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

function getStoredProfile(): UserProfile {
  const defaultProfile: UserProfile = {
    username: "",
    email: "",
    phone: "",
    avatar: null,
    user_type: "customer",
  };

  if (typeof window === "undefined") return defaultProfile;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as UserProfile;
    return {
      id: parsed.id,
      username: parsed.username || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      avatar: parsed.avatar ?? null,
      user_type: parsed.user_type || "customer",
    };
  } catch {
    return defaultProfile;
  }
}

function userToProfile(user: { id?: number; username: string; email: string; phone?: string; avatar?: string | null; user_type: string }): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone ?? "",
    avatar: user.avatar ?? null,
    user_type: user.user_type as UserType,
  };
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [storedProfile, setStoredProfile] = React.useState<UserProfile>(getStoredProfile);

  const profile: UserProfile = React.useMemo(() => {
    if (isAuthenticated && user) {
      return userToProfile(user);
    }
    return storedProfile;
  }, [isAuthenticated, user, storedProfile]);

  const updateProfile = React.useCallback((partial: Partial<UserProfile>) => {
    setStoredProfile((prev) => {
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
