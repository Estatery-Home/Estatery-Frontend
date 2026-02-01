"use client";

import * as React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard";
import { getNotificationById } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const iconMap = {
  agent: Users,
  property_alert: BarChart3,
  expired: AlertTriangle,
};

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notification = id ? getNotificationById(id) : undefined;

  if (!notification) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm">
          <p className="text-[#64748b]">Notification not found.</p>
          <Button onClick={() => navigate("/dashboard/notifications")} variant="outline" className="mt-4">
            Back to Notifications
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = iconMap[notification.type];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to="/dashboard/notifications"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] hover:text-[#21438D]"
        >
          <ArrowLeft className="size-4" />
          Back to Notifications
        </Link>
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-full",
                notification.unread ? "bg-[#e0f2fe]" : "bg-[#f1f5f9]"
              )}
            >
              <Icon className="size-7 text-[#0369a1]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#64748b]">{notification.time}</p>
              <h1 className="mt-1 text-xl font-bold text-[#1e293b]">{notification.title}</h1>
            </div>
          </div>
          <div className="mt-6 border-t border-[#e2e8f0] pt-6">
            <p className="text-[#64748b] leading-relaxed">{notification.body}</p>
            {notification.actionHref && notification.actionLabel && (
              <Button asChild className="mt-4">
                <Link to={notification.actionHref}>{notification.actionLabel}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
