"use client";

/**
 * Polls /api/notifications/unread-count/ while authenticated and exposes
 * list refresh + mark-read for the admin notification bell and panel.
 */
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiHeaders } from "@/lib/api-client";
import type { Notification } from "@/lib/notifications";
import { mapApiNotification } from "@/lib/notifications";

const POLL_MS = 30_000;

type NotificationsContextValue = {
  unreadCount: number;
  notifications: Notification[];
  isLoadingList: boolean;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(false);

  const refreshUnreadCount = React.useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await fetch(api.endpoints.notificationsUnreadCount, {
      headers: apiHeaders(true),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { unread_count?: number };
    setUnreadCount(typeof data.unread_count === "number" ? data.unread_count : 0);
  }, [isAuthenticated]);

  const refreshNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingList(true);
    try {
      const res = await fetch(api.endpoints.notifications, { headers: apiHeaders(true) });
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = (await res.json()) as {
        results?: unknown[];
        unread_count?: number;
      };
      const raw = Array.isArray(data) ? data : data.results ?? [];
      const items = raw.map((row) => mapApiNotification(row as Record<string, unknown>));
      setNotifications(items);
      if (typeof data.unread_count === "number") setUnreadCount(data.unread_count);
    } finally {
      setIsLoadingList(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    void refreshUnreadCount();
    const id = window.setInterval(() => void refreshUnreadCount(), POLL_MS);
    return () => window.clearInterval(id);
  }, [isAuthenticated, refreshUnreadCount]);

  const markNotificationRead = React.useCallback(
    async (id: number) => {
      const res = await fetch(api.endpoints.notificationMarkRead(id), {
        method: "POST",
        headers: apiHeaders(true),
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
    const res = await fetch(api.endpoints.notificationsMarkAllRead, {
      method: "POST",
      headers: apiHeaders(true),
    });
    if (!res.ok) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
    }),
    [
      unreadCount,
      notifications,
      isLoadingList,
      refreshUnreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
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
