export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Void";
export type PaymentStatus = "Unsent" | "Open" | "Partial" | "Overdue" | "Paid" | "Voided"; // Overdue is derived: never stored in DB; computed on read when dueDate < today && paymentStatus === "Open" or "Partial"

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string; // ISO 8601
  actor: string;
  action: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  billingEmail: string;
  billingAddress: string;
  paymentTerms: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  amountPaid?: number;
  memo: string;
  taxRate: number;
  discount: number;
  lineItems: LineItem[];
  activity: ActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DerivedTotals {
  subtotal: number;
  discounted: number;
  tax: number;
  total: number;
}

export type InvoiceListItem = Omit<Invoice, "lineItems" | "activity" | "memo">;

export interface AssistantDraft {
  draft: Partial<Omit<Invoice, "id" | "status" | "paymentStatus" | "createdAt" | "updatedAt" | "activity">>;
  needsReview: string[];
}
