/**
 * Client types and mock data for the clients list and detail views.
 */
export type ClientStatus = "On Going" | "Completed" | "Overdue";

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
};

export const clientsTableData: ClientRow[] = [
  {
    id: "c1",
    clientId: "32484",
    name: "James Smith",
    avatarInitials: "JS",
    propertyName: "Pine View Apartments",
    propertyAddress: "123 Maple St, Springfield, USA",
    type: "Rent",
    amount: 1800,
    nextPayment: "2025-07-15",
    status: "On Going",
  },
  {
    id: "c2",
    clientId: "32485",
    name: "Linda Johnson",
    avatarInitials: "LJ",
    propertyName: "Cedar Park",
    propertyAddress: "456 Oak Ave, Springfield, USA",
    type: "Rent",
    amount: 950,
    nextPayment: "2025-08-05",
    status: "On Going",
  },
  {
    id: "c3",
    clientId: "32486",
    name: "Robert Brown",
    avatarInitials: "RB",
    propertyName: "Sunnydale Residences",
    propertyAddress: "789 Birch Blvd, Springfield, USA",
    type: "Rent",
    amount: 1200,
    nextPayment: "2025-09-01",
    status: "On Going",
  },
  {
    id: "c4",
    clientId: "32487",
    name: "Jessica Wilson",
    avatarInitials: "JW",
    propertyName: "Lakeside Manor",
    propertyAddress: "321 Willow Way, Springfield, USA",
    type: "Rent",
    amount: 1450,
    nextPayment: "2025-10-10",
    status: "On Going",
  },
  {
    id: "c5",
    clientId: "32488",
    name: "Michael Taylor",
    avatarInitials: "MT",
    propertyName: "Hilltop Suites",
    propertyAddress: "654 Pine St, Springfield, USA",
    type: "Rent",
    amount: 1350,
    nextPayment: "2025-11-20",
    status: "On Going",
  },
  {
    id: "c6",
    clientId: "32489",
    name: "Sara Davis",
    avatarInitials: "SD",
    propertyName: "Riverbend Apartments",
    propertyAddress: "987 River Rd, Springfield, USA",
    type: "Rent",
    amount: 1100,
    nextPayment: "2025-12-30",
    status: "On Going",
  },
  {
    id: "c7",
    clientId: "32490",
    name: "David Martinez",
    avatarInitials: "DM",
    propertyName: "Oak Grove Estates",
    propertyAddress: "159 Elm St, Springfield, USA",
    type: "Rent",
    amount: 1300,
    nextPayment: "2026-01-05",
    status: "On Going",
  },
  {
    id: "c8",
    clientId: "32483",
    name: "Amanda Lee",
    avatarInitials: "AL",
    propertyName: "Murphy House",
    propertyAddress: "742 Evergreen Terrace, Springfield, USA",
    type: "Rent",
    amount: 213,
    nextPayment: "2025-06-21",
    status: "Completed",
  },
  {
    id: "c9",
    clientId: "32491",
    name: "Karen Hernandez",
    avatarInitials: "KH",
    propertyName: "Seaside Retreat",
    propertyAddress: "258 Coastline Dr, Springfield, USA",
    type: "Rent",
    amount: 1700,
    nextPayment: "2026-02-14",
    status: "On Going",
  },
];

export type ClientDetail = {
  clientId: string;
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

const baseTransactions: ClientTransaction[] = [
  {
    id: "34943",
    paymentType: "Final Payment",
    dueDate: "2025-07-28",
    amount: 426.0,
    status: "Pending",
  },
  {
    id: "34944",
    paymentType: "4th Payment",
    dueDate: "2025-07-23",
    amount: 150.0,
    status: "Pending",
  },
  {
    id: "34945",
    paymentType: "3rd Payment",
    dueDate: "2025-07-19",
    amount: 732.5,
    status: "Pending",
  },
  {
    id: "34946",
    paymentType: "2nd Payment",
    dueDate: "2025-07-10",
    amount: 300.0,
    status: "Pending",
  },
  {
    id: "34947",
    paymentType: "1st Payment",
    dueDate: "2025-06-30",
    amount: 200.0,
    status: "Paid",
  },
  {
    id: "34948",
    paymentType: "Deposit",
    dueDate: "2025-06-27",
    amount: 550.75,
    status: "Paid",
  },
];

export function getClientTransactions(clientId: string): ClientTransaction[] {
  // For now all clients share the same demo transactions.
  // This can be made client-specific later if needed.
  if (!clientsTableData.find((c) => c.clientId === clientId)) {
    return [];
  }
  return baseTransactions;
}


