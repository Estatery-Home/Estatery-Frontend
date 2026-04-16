/**
 * Notification types and API mapping for the admin panel (bell, list, detail).
 */
export type NotificationType = "agent" | "property_alert" | "expired" | "message";

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  time: string;
  unread: boolean;
  body: string;
  action_href?: string;
  action_label?: string;
  created_at?: string;
};

const TYPE_SET = new Set<string>(["agent", "property_alert", "expired", "message"]);

export function mapApiNotification(raw: Record<string, unknown>): Notification {
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  const t = String(raw.type ?? "agent");
  const type: NotificationType = TYPE_SET.has(t) ? (t as NotificationType) : "agent";
  return {
    id: Number.isFinite(id) ? id : 0,
    type,
    title: String(raw.title ?? ""),
    body: String(raw.body ?? ""),
    time: String(raw.time ?? ""),
    unread: Boolean(raw.unread),
    action_href: raw.action_href ? String(raw.action_href) : undefined,
    action_label: raw.action_label ? String(raw.action_label) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}
