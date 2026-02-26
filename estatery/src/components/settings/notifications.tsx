"use client";

/**
 * Notification preferences – transaction/payment toggles.
 * Uses SettingsContext.notifications; Revert in parent.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import type { NotificationSettings } from "@/contexts/SettingsContext";

const NOTIFICATION_ITEMS: {
  key: keyof NotificationSettings;
  title: string;
  description: string;
}[] = [
  {
    key: "transactionConfirmation",
    title: "Transaction Confirmation",
    description: "Sent automatically to the customer after they place their order.",
  },
  {
    key: "transactionEdited",
    title: "Transaction Edited",
    description:
      "Sent to the customer after their order is edited (if you select this option).",
  },
  {
    key: "transactionInvoice",
    title: "Transaction Invoice",
    description: "Sent to the customer when the order has an outstanding balance.",
  },
  {
    key: "transactionCancelled",
    title: "Transaction Cancelled",
    description:
      "Sent automatically to the customer if their order is cancelled (if you select this option).",
  },
  {
    key: "transactionRefund",
    title: "Transaction Refund",
    description:
      "Sent automatically to the customer if their order is refunded (if you select this option).",
  },
  {
    key: "paymentError",
    title: "Payment Error",
    description:
      "Sent automatically to the customer if their payment can't be processed during checkout.",
  },
];

export function Notifications() {
  const { notifications, setNotifications } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[#1e293b]">Push Notifications</h3>
        <p className="mt-1 text-sm text-[#64748b]">
          Get alerts for new orders, order processing updates, and when orders are completed or
          canceled.
        </p>
      </div>

      <div className="space-y-1">
        {NOTIFICATION_ITEMS.map((item) => {
          const isOn = notifications[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4"
            >
              <div>
                <p className="font-medium text-[#1e293b]">{item.title}</p>
                <p className="mt-0.5 text-sm text-[#64748b]">{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--logo)] focus-visible:ring-offset-2",
                  isOn ? "bg-[var(--logo)]" : "bg-[#e2e8f0]"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform",
                    isOn ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
