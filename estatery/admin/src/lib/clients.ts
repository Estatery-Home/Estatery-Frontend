/**
 * Client types and mock data for the clients list and detail views.
 */
import type { HostClientListRowApi } from "@/lib/api-types";

export type ClientStatus = "On Going" | "Completed" | "Overdue";

// ClientRow to be used in the app to access the client row data
export type ClientRow = {
  id: string;
  clientId: string;
  name: string;
  avatarInitials: string;
  propertyName: string;
  propertyAddress: string;
  type: "Rent" | "Buy";
  amount: number;
  nextPayment: string; // ISO-like date string
  status: ClientStatus;
  /** Property / booking currency code (e.g. ghs) for display */
  currency?: string;
};

export function mapHostClientListRow(raw: HostClientListRowApi): ClientRow {
  const amount = parseFloat(String(raw.amount)) || 0;
  return {
    id: String(raw.id),
    clientId: String(raw.clientId),
    name: raw.name,
    avatarInitials: raw.avatarInitials,
    propertyName: raw.propertyName,
    propertyAddress: raw.propertyAddress,
    type: raw.type === "Buy" ? "Buy" : "Rent",
    amount,
    nextPayment: raw.nextPayment ?? "",
    status: raw.status,
    currency: raw.currency || "ghs",
  };
}

// Intentionally empty: use API-backed client rows only.
export const clientsTableData: ClientRow[] = [];

// ClientDetail to be used in the app to access the client detail data
export type ClientDetail = {
  clientId: string;
  /** When set (e.g. from bookings API), Messages can open a real thread with this user id */
  tenantUserId?: number;
  name: string;
  avatarInitials: string;
  email: string;
  phone: string;
  bio: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
  transactionDate: string;
  transactionType: string;
  rentDuration: string;
};

export type ClientTransactionStatus = "Pending" | "Paid";

export type ClientTransaction = {
  id: string;
  paymentType: string;
  dueDate: string;
  amount: number;
  status: ClientTransactionStatus;
};

const DEFAULT_BIO =
  "Lorem ipsum is simply dummy text of the printing and typesetting industry. It has been the industry's standard dummy text since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";


  // getClientDetail to be used in the app to get the client detail data
export function getClientDetail(clientId: string): ClientDetail | undefined {
  const base = clientsTableData.find((c) => c.clientId === clientId);
  if (!base) return undefined;

  const email = `${base.name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
  const phone = `+1 (555) 01${base.clientId.slice(-4)}`;

  return {
    clientId: base.clientId,
    name: base.name,
    avatarInitials: base.avatarInitials,
    email,
    phone,
    bio: DEFAULT_BIO,
    propertyName: base.propertyName,
    propertyAddress: base.propertyAddress,
    propertyType: "House",
    transactionDate: "2025-06-02",
    transactionType: "Purchased",
    rentDuration: "Owned",
  };
}

// Intentionally empty: use API-backed transaction rows only.
const baseTransactions: ClientTransaction[] = [];

export function getClientTransactions(clientId: string): ClientTransaction[] {
  // For now all clients share the same demo transactions.
  // This can be made client-specific later if needed.
  if (!clientsTableData.find((c) => c.clientId === clientId)) {
    return [];
  }
  return baseTransactions;
}


