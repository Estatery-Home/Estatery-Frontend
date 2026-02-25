/**
 * Agents page – mock data and constants.
 * Keeps the main Agents screen cleaner and easier to maintain.
 */
import type { LucideIcon } from "lucide-react";
import { Users, UserCheck, Clock } from "lucide-react";

export type AgentStatus = "Active" | "Pending" | "Inactive";

export type Agent = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  properties: number;
  dealsClosed: number;
  rating: number;
  status: AgentStatus;
};

export const mockAgents: Agent[] = [
  {
    id: "A-1021",
    name: "Sarah Lee",
    initials: "SL",
    email: "sarah.lee@example.com",
    phone: "+1 (555) 011-2345",
    properties: 24,
    dealsClosed: 18,
    rating: 4.9,
    status: "Active",
  },
  {
    id: "A-1022",
    name: "Jonathan Cruz",
    initials: "JC",
    email: "jonathan.cruz@example.com",
    phone: "+1 (555) 016-7890",
    properties: 15,
    dealsClosed: 9,
    rating: 4.6,
    status: "Pending",
  },
  {
    id: "A-1023",
    name: "Amanda Lee",
    initials: "AL",
    email: "amanda.lee@example.com",
    phone: "+1 (555) 018-9876",
    properties: 12,
    dealsClosed: 7,
    rating: 4.4,
    status: "Active",
  },
  {
    id: "A-1024",
    name: "Robert Brown",
    initials: "RB",
    email: "robert.brown@example.com",
    phone: "+1 (555) 017-4456",
    properties: 4,
    dealsClosed: 2,
    rating: 4.1,
    status: "Inactive",
  },
];

/** Gradient classes for agent avatar initials */
export const AVATAR_GRADIENTS = [
  "from-[#6366f1] to-[#8b5cf6]",
  "from-[#0ea5e9] to-[#06b6d4]",
  "from-[#f59e0b] to-[#f97316]",
  "from-[#10b981] to-[#14b8a6]",
];

/** Stat card config – maps to counts in the Agents screen */
export const statCards: {
  title: string;
  valueKey: "total" | "active" | "pending";
  icon: LucideIcon;
  gradient: string;
  bgMuted: string;
}[] = [
  {
    title: "Total Agents",
    valueKey: "total",
    icon: Users,
    gradient: "from-[#6366f1] to-[#8b5cf6]",
    bgMuted: "bg-indigo-50",
  },
  {
    title: "Active",
    valueKey: "active",
    icon: UserCheck,
    gradient: "from-[#10b981] to-[#14b8a6]",
    bgMuted: "bg-emerald-50",
  },
  {
    title: "Pending approvals",
    valueKey: "pending",
    icon: Clock,
    gradient: "from-[#f59e0b] to-[#f97316]",
    bgMuted: "bg-amber-50",
  },
];

/** Get initials from full name (e.g. "John Doe" → "JD") */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Generate next agent ID based on existing IDs */
export function nextAgentId(agents: Agent[]): string {
  const nums = agents
    .map((a) => parseInt(a.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1024;
  return `A-${max + 1}`;
}
