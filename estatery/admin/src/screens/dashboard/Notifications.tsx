"use client";

/**
 * Notifications list – links to detail; unread styling from API.
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { Users, BarChart3, AlertTriangle, MessageCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { useNotifications } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";

const iconMap = {
  agent: Users,
  property_alert: BarChart3,
  expired: AlertTriangle,
  message: MessageCircle,
};

export default function Notifications() {
  const { notifications, isLoadingList, refreshNotifications, clearAllNotifications } =
    useNotifications();

  React.useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const canClear = notifications.length > 0 && !isLoadingList;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-[#1e293b]">Notifications</h1>
          <button
            type="button"
            onClick={() => void clearAllNotifications()}
            disabled={!canClear}
            className="shrink-0 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#1e293b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear notifications
          </button>
        </div>
        <div className="space-y-0 rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
          {isLoadingList && notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[#64748b]">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[#64748b]">No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const Icon = iconMap[n.type];
              return (
                <Link
                  key={n.id}
                  to={`/dashboard/notifications/${n.id}`}
                  className={cn(
                    "flex gap-4 border-b border-[#e2e8f0] px-5 py-4 transition-colors last:border-b-0 hover:bg-[#f8fafc]",
                    n.unread && "bg-[#f0f9ff]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[var(--logo-muted)] text-[var(--logo)]">
                      <Icon className="size-6" />
                    </div>
                    {n.unread && (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-[#ef4444]" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1e293b]">{n.title}</p>
                    <p className="mt-0.5 text-sm text-[#64748b]">{n.time}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
