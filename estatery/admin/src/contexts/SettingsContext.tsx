"use client";

/**
 * SettingsContext – User and app settings persisted in localStorage.
 *
 * Sections: notifications, general, links, time/lang, payment, tax.
 * Each section has state, setter, save, and (where applicable) revert.
 */
import * as React from "react";

export type NotificationSettings = {
  transactionConfirmation: boolean;
  transactionEdited: boolean;
  transactionInvoice: boolean;
  transactionCancelled: boolean;
  transactionRefund: boolean;
  paymentError: boolean;
};

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
  instagram: "https://www.instagram.com/luxeyline",
  facebook: "https://www.facebook.com/luxeyline",
  twitter: "https://www.twitter.com/luxeyline",
  youtube: "https://www.youtube.com/luxeyline",
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

function saveNotifications(n: NotificationSettings) {
  save("notifications", n);
}

type SettingsContextValue = {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  saveNotifications: () => void;
  revertNotifications: () => void;
  general: GeneralSettings;
  setGeneral: React.Dispatch<React.SetStateAction<GeneralSettings>>;
  saveGeneral: () => void;
  links: LinksSettings;
  setLinks: React.Dispatch<React.SetStateAction<LinksSettings>>;
  saveLinks: () => void;
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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<NotificationSettings>(loadNotifications);
  const savedRef = React.useRef<NotificationSettings>(loadNotifications());

  /* Initialize each section from localStorage or defaults */
  const [general, setGeneral] = React.useState<GeneralSettings>(() => load("general", DEFAULT_GENERAL));
  const [links, setLinks] = React.useState<LinksSettings>(() => load("links", DEFAULT_LINKS));
  const [timeLang, setTimeLang] = React.useState<TimeLangSettings>(() => load("timeLang", DEFAULT_TIME_LANG));
  const [payment, setPayment] = React.useState<PaymentSettings>(() => load("payment", DEFAULT_PAYMENT));
  const [tax, setTax] = React.useState<TaxSettings>(() => load("tax", DEFAULT_TAX));

  /* Save each section to localStorage when user clicks Save */
  const saveNotificationsToStorage = React.useCallback(() => {
    setNotifications((prev) => {
      saveNotifications(prev);
      savedRef.current = prev;
      return prev;
    });
  }, []);

  /* Reload notifications from storage, discarding unsaved changes */
  const revertNotifications = React.useCallback(() => {
    const saved = loadNotifications();
    savedRef.current = saved;
    setNotifications(saved);
  }, []);

  const saveGeneralToStorage = React.useCallback(() => {
    setGeneral((prev) => {
      save("general", prev);
      return prev;
    });
  }, []);

  const saveLinksToStorage = React.useCallback(() => {
    setLinks((prev) => {
      save("links", prev);
      return prev;
    });
  }, []);

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
