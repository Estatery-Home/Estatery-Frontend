"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Users, BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifications, markAllNotificationsRead } from "@/lib/notifications";

const iconMap = {
  agent: Users,
  property_alert: BarChart3,
  expired: AlertTriangle,
};

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [localUnread, setLocalUnread] = React.useState<Record<string, boolean>>({});

  const markAllRead = () => {
    markAllNotificationsRead();
    setLocalUnread({});
  };

  const isUnread = (id: string) => localUnread[id] !== false && notifications.find((n) => n.id === id)?.unread;

  if (!open) return null;

  const panel = (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-[#e2e8f0] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1e293b]">Notifications</h2>
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-medium text-[#21438D] hover:underline"
          >
            Mark all as read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <Link
                key={n.id}
                to={`/dashboard/notifications/${n.id}`}
                onClick={onClose}
                className={cn(
                  "flex gap-3 border-b border-[#e2e8f0] px-5 py-4 transition-colors hover:bg-[#f8fafc]",
                  n.unread && "bg-[#f0f9ff]"
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#e0f2fe] text-[#0369a1]">
                    <Icon className="size-5" />
                  </div>
                  {n.unread && (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#ef4444]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#1e293b]">{n.title}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{n.time}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="shrink-0 border-t border-[#e2e8f0] px-5 py-4">
          <Link
            to="/dashboard/notifications"
            onClick={onClose}
            className="text-sm font-medium text-[#21438D] hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(panel, document.body) : null;
}
