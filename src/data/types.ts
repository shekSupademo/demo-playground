export type AccountType = "checking" | "savings" | "treasury";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  last4: string;
  balance: number; // cents
  apy?: number;
}

export type TxStatus = "posted" | "pending" | "failed";
export type TxMethod = "card" | "ach" | "wire" | "transfer" | "check";

export const CATEGORIES = [
  "Software",
  "Payroll",
  "Advertising",
  "Travel",
  "Meals",
  "Office",
  "Contractors",
  "Rent",
  "Utilities",
  "Revenue",
  "Taxes",
  "Transfer",
  "Uncategorized",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Transaction {
  id: string;
  date: string; // ISO date
  counterparty: string;
  description: string;
  amount: number; // cents, negative is money out
  accountId: string;
  category: Category;
  status: TxStatus;
  method: TxMethod;
  cardId?: string;
  note?: string;
  receipt?: string;
}

export interface Card {
  id: string;
  name: string;
  holder: string;
  last4: string;
  kind: "virtual" | "physical";
  monthlyLimit: number; // cents
  frozen: boolean;
  accountId: string;
  color: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  bank: string;
  last4: string;
  method: "ach" | "wire";
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // cents
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  email: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
}

export type Role = "admin" | "bookkeeper" | "employee";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
}

export interface Settings {
  companyName: string;
  userName: string;
  theme: "light" | "dark" | "system";
  notifications: {
    largeTransactions: boolean;
    weeklySummary: boolean;
    cardDeclines: boolean;
    invoicePaid: boolean;
  };
  largeTransactionThreshold: number; // cents
}

export type BillStatus = "inbox" | "approved" | "scheduled" | "paid";
export const BILL_COLUMNS: { id: BillStatus; label: string; help: string }[] = [
  { id: "inbox", label: "Inbox", help: "New bills to review" },
  { id: "approved", label: "Approved", help: "Ready to schedule" },
  { id: "scheduled", label: "Scheduled", help: "Payment is queued" },
  { id: "paid", label: "Paid", help: "Settled this month" },
];

export interface Bill {
  id: string;
  vendor: string;
  amount: number; // cents
  dueDate: string;
  category: Category;
  status: BillStatus;
  invoiceRef: string;
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  recipients: Recipient[];
  invoices: Invoice[];
  members: Member[];
  bills: Bill[];
  settings: Settings;
}
