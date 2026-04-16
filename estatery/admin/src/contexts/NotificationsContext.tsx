"use client";

/**
 * Polls /api/notifications/unread-count/ while authenticated and exposes
 * list refresh + mark-read for the admin notification bell and panel.
 */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken } from "@/lib/api-client";
import { fetchWithAuthRetry } from "@/lib/auth-session";
import type { Notification } from "@/lib/notifications";
import { mapApiNotification } from "@/lib/notifications";

/** Poll unread count so new notifications show up without a full page reload */
const POLL_MS = 15_000;

type NotificationsContextValue = {
  unreadCount: number;
  notifications: Notification[];
  isLoadingList: boolean;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  /** Deletes all notifications server-side; UI list and badge empty. */
  clearAllNotifications: () => Promise<void>;
};

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(false);

  const refreshUnreadCount = React.useCallback(async () => {
    if (!isAuthenticated || authLoading) return;
    if (!getAccessToken()) return;
    const res = await fetchWithAuthRetry(api.endpoints.notificationsUnreadCount, {
      cache: "no-store",
    });
    if (!res.ok) return;
    try {
      const data = (await res.json()) as { unread_count?: number };
      setUnreadCount(typeof data.unread_count === "number" ? data.unread_count : 0);
    } catch {
      /* non-JSON error page */
    }
  }, [isAuthenticated, authLoading]);

  const refreshNotifications = React.useCallback(async () => {
    if (!isAuthenticated || authLoading) return;
    if (!getAccessToken()) return;
    setIsLoadingList(true);
    try {
      const res = await fetchWithAuthRetry(api.endpoints.notifications, { cache: "no-store" });
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        setNotifications([]);
        return;
      }
      const raw = Array.isArray(payload)
        ? payload
        : ((payload as { results?: unknown[] }).results ?? []);
      const items = raw.map((row) => mapApiNotification(row as Record<string, unknown>));
      setNotifications(items);
      if (!Array.isArray(payload)) {
        const u = (payload as { unread_count?: number }).unread_count;
        if (typeof u === "number") setUnreadCount(u);
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [isAuthenticated, authLoading]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    void refreshUnreadCount();
    const retrySoon = window.setTimeout(() => void refreshUnreadCount(), 250);
    const id = window.setInterval(() => void refreshUnreadCount(), POLL_MS);
    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") void refreshUnreadCount();
    };
    const onWindowFocus = () => void refreshUnreadCount();
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.clearTimeout(retrySoon);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [isAuthenticated, authLoading, refreshUnreadCount]);

  const markNotificationRead = React.useCallback(
    async (id: number) => {
      const res = await fetchWithAuthRetry(api.endpoints.notificationMarkRead(id), {
        method: "POST",
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      await refreshUnreadCount();
    },
    [refreshUnreadCount]
  );

  const markAllNotificationsRead = React.useCallback(async () => {
    const res = await fetchWithAuthRetry(api.endpoints.notificationsMarkAllRead, {
      method: "POST",
    });
    if (!res.ok) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  const clearAllNotifications = React.useCallback(async () => {
    if (!getAccessToken()) return;
    const res = await fetchWithAuthRetry(api.endpoints.notificationsClearAll, {
      method: "POST",
    });
    if (!res.ok) return;
    setNotifications([]);
    setUnreadCount(0);
    await refreshUnreadCount();
  }, [refreshUnreadCount]);

  const value = React.useMemo(
    () => ({
      unreadCount,
      notifications,
      isLoadingList,
      refreshUnreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearAllNotifications,
    }),
    [
      unreadCount,
      notifications,
      isLoadingList,
      refreshUnreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      clearAllNotifications,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
