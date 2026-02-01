export type NotificationType = "agent" | "property_alert" | "expired";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  time: string;
  unread: boolean;
  /** Full body for detail page */
  body: string;
  /** Optional link (e.g. to agent or property) */
  actionHref?: string;
  actionLabel?: string;
};

export const notifications: Notification[] = [
  {
    id: "1",
    type: "agent",
    title: "Jonathan Cruz has registered as a new agent. Awaiting approval.",
    time: "2 minute ago",
    unread: true,
    body: "Jonathan Cruz has submitted an application to join as a new agent. Their profile is pending review. Please review their credentials and approve or reject the application from the Agents section.",
    actionHref: "/dashboard/agents",
    actionLabel: "Go to Agents",
  },
  {
    id: "2",
    type: "property_alert",
    title: "Sunset Villa Bali has received 120 views and 18 leads in the past 24 hours.",
    time: "1 hour ago",
    unread: true,
    body: "Sunset Villa Bali is trending. In the last 24 hours it has received 120 views and 18 new leads. Consider following up with interested clients or promoting this listing further.",
    actionHref: "/dashboard/properties",
    actionLabel: "View Properties",
  },
  {
    id: "3",
    type: "expired",
    title: "Listing for 'Maplewood Townhouse' has expired. Please review or renew.",
    time: "Yesterday, 4:35 PM",
    unread: false,
    body: "The listing for Maplewood Townhouse has expired. To keep it visible to clients, please renew the listing from the Properties section or update the listing details.",
    actionHref: "/dashboard/properties",
    actionLabel: "Renew Listing",
  },
];

export function getNotificationById(id: string): Notification | undefined {
  return notifications.find((n) => n.id === id);
}

export function markNotificationRead(id: string): void {
  const n = notifications.find((n) => n.id === id);
  if (n) n.unread = false;
}

export function markAllNotificationsRead(): void {
  notifications.forEach((n) => (n.unread = false));
}
