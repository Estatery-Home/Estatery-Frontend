"use client";

/**
 * SettingsContext – User and app settings persisted in localStorage.
 *
 * Sections: notifications, general, links, time/lang, payment, tax.
 * Notification toggles sync with GET/PATCH /api/notifications/preferences/ when logged in.
 */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotificationPreferences,
  patchNotificationPreferences,
  fetchProfile,
  patchProfile,
  type NotificationPreferencesClient,
} from "@/lib/api-client";

export type NotificationSettings = NotificationPreferencesClient;

export type GeneralSettings = {
  companyName: string;
  industry: string;
  currency: string;
  addressName: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
};

export type LinksSettings = {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
};

export type TimeLangSettings = {
  timeZone: string;
  language: string;
};

export type PaymentSettings = {
  billingEmail: string;
};

export type TaxSettings = {
  fullName: string;
  treatyCountry: string;
  permanentResidence: string;
  mailingAddress: string;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  transactionConfirmation: true,
  transactionEdited: false,
  transactionInvoice: true,
  transactionCancelled: true,
  transactionRefund: true,
  paymentError: false,
};

const DEFAULT_GENERAL: GeneralSettings = {
  companyName: "Luxeyline",
  industry: "real-estate",
  currency: "ghs",
  addressName: "Apartment",
  country: "us",
  city: "Los Angeles",
  address: "123 Sunset Boulevard, Los Angeles, CA",
  postalCode: "90028",
};

const DEFAULT_LINKS: LinksSettings = {
  instagram: "",
  facebook: "",
  twitter: "",
  youtube: "",
};

const DEFAULT_TIME_LANG: TimeLangSettings = {
  timeZone: "America/Los_Angeles",
  language: "en-US",
};

const DEFAULT_PAYMENT: PaymentSettings = {
  billingEmail: "robertjohnson@gmail.com",
};

const DEFAULT_TAX: TaxSettings = {
  fullName: "Robert Johnson",
  treatyCountry: "us",
  permanentResidence: "123 Elm Street, Springfield, IL 62704",
  mailingAddress: "456 Maple Avenue, Rivertown, TX 75001",
};

const STORAGE_KEY = "estatery-settings";

function load<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}-${key}`);
    if (!raw) return defaultVal;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...defaultVal, ...parsed };
  } catch {
    return defaultVal;
  }
}

function save<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function loadNotifications(): NotificationSettings {
  return load("notifications", DEFAULT_NOTIFICATIONS);
}

type SettingsContextValue = {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  saveNotifications: () => Promise<void>;
  revertNotifications: () => Promise<void>;
  general: GeneralSettings;
  setGeneral: React.Dispatch<React.SetStateAction<GeneralSettings>>;
  saveGeneral: () => void;
  links: LinksSettings;
  setLinks: React.Dispatch<React.SetStateAction<LinksSettings>>;
  saveLinks: () => Promise<void>;
  timeLang: TimeLangSettings;
  setTimeLang: React.Dispatch<React.SetStateAction<TimeLangSettings>>;
  saveTimeLang: () => void;
  payment: PaymentSettings;
  setPayment: React.Dispatch<React.SetStateAction<PaymentSettings>>;
  savePayment: () => void;
  tax: TaxSettings;
  setTax: React.Dispatch<React.SetStateAction<TaxSettings>>;
  saveTax: () => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

function userToLinks(u: {
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
}): LinksSettings {
  return {
    instagram: u.instagram_url ?? "",
    facebook: u.facebook_url ?? "",
    twitter: u.twitter_url ?? "",
    youtube: u.youtube_url ?? "",
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshUser } = useAuth();
  const [notifications, setNotifications] = React.useState<NotificationSettings>(loadNotifications);
  const savedRef = React.useRef<NotificationSettings>(loadNotifications());
  const notificationsRef = React.useRef<NotificationSettings>(loadNotifications());

  React.useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  /* Logged out: show cached local defaults only (avoid showing another user's toggles). */
  React.useEffect(() => {
    if (isAuthenticated) return;
    const local = loadNotifications();
    setNotifications(local);
    savedRef.current = local;
  }, [isAuthenticated]);

  /* Load notification preferences from API when logged in (overrides local cache). */
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const prefs = await fetchNotificationPreferences();
      if (cancelled || !prefs) return;
      setNotifications(prefs);
      savedRef.current = prefs;
      save("notifications", prefs);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* Load social link handles from API when logged in (same values apply to all owned listings). */
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const u = await fetchProfile();
      if (cancelled || !u) return;
      const next = userToLinks(u);
      setLinks(next);
      save("links", next);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* Initialize each section from localStorage or defaults */
  const [general, setGeneral] = React.useState<GeneralSettings>(() => load("general", DEFAULT_GENERAL));
  const [links, setLinks] = React.useState<LinksSettings>(() => load("links", DEFAULT_LINKS));
  const linksRef = React.useRef(links);
  React.useEffect(() => {
    linksRef.current = links;
  }, [links]);
  const [timeLang, setTimeLang] = React.useState<TimeLangSettings>(() => load("timeLang", DEFAULT_TIME_LANG));
  const [payment, setPayment] = React.useState<PaymentSettings>(() => load("payment", DEFAULT_PAYMENT));
  const [tax, setTax] = React.useState<TaxSettings>(() => load("tax", DEFAULT_TAX));

  /* Save notification toggles to API and mirror to localStorage */
  const saveNotificationsToStorage = React.useCallback(async () => {
    const prefs = notificationsRef.current;
    const saved = await patchNotificationPreferences(prefs);
    save("notifications", saved);
    savedRef.current = saved;
    setNotifications(saved);
  }, []);

  /* Reload from API, or localStorage if offline */
  const revertNotifications = React.useCallback(async () => {
    const fromApi = await fetchNotificationPreferences();
    if (fromApi) {
      savedRef.current = fromApi;
      setNotifications(fromApi);
      save("notifications", fromApi);
      return;
    }
    const local = loadNotifications();
    savedRef.current = local;
    setNotifications(local);
  }, []);

  const saveGeneralToStorage = React.useCallback(() => {
    setGeneral((prev) => {
      save("general", prev);
      return prev;
    });
  }, []);

  const saveLinksToStorage = React.useCallback(async () => {
    const current = linksRef.current;
    await patchProfile({
      instagram_url: current.instagram.trim(),
      facebook_url: current.facebook.trim(),
      twitter_url: current.twitter.trim(),
      youtube_url: current.youtube.trim(),
    });
    save("links", current);
    await refreshUser();
  }, [refreshUser]);

  const saveTimeLangToStorage = React.useCallback(() => {
    setTimeLang((prev) => {
      save("timeLang", prev);
      return prev;
    });
  }, []);

  const savePaymentToStorage = React.useCallback(() => {
    setPayment((prev) => {
      save("payment", prev);
      return prev;
    });
  }, []);

  const saveTaxToStorage = React.useCallback(() => {
    setTax((prev) => {
      save("tax", prev);
      return prev;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      notifications,
      setNotifications,
      saveNotifications: saveNotificationsToStorage,
      revertNotifications,
      general,
      setGeneral,
      saveGeneral: saveGeneralToStorage,
      links,
      setLinks,
      saveLinks: saveLinksToStorage,
      timeLang,
      setTimeLang,
      saveTimeLang: saveTimeLangToStorage,
      payment,
      setPayment,
      savePayment: savePaymentToStorage,
      tax,
      setTax,
      saveTax: saveTaxToStorage,
    }),
    [
      notifications,
      saveNotificationsToStorage,
      revertNotifications,
      general,
      saveGeneralToStorage,
      links,
      saveLinksToStorage,
      timeLang,
      saveTimeLangToStorage,
      payment,
      savePaymentToStorage,
      tax,
      saveTaxToStorage,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
