export const KNOWN_ACCOUNT_CODES = [
  { code: "4000", label: "4000 — Subscription Revenue" },
  { code: "4010", label: "4010 — Usage Revenue" },
  { code: "4100", label: "4100 — Professional Services" },
  { code: "4200", label: "4200 — Advisory Services" },
  { code: "4300", label: "4300 — Support Revenue" },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  "Net 15", "Net 30", "Net 45", "Due on receipt",
] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ["send", "void"],
  Sent: ["recordPayment", "recordPartialPayment", "void"],
  Partial: ["recordPayment", "void"],  // partial-paid invoices (status is still Sent, but show these options)
  Paid: [],
  Void: [],
};

// Overdue is derived: dueDate < today && paymentStatus === "Open" or "Partial". Never stored in DB.
export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  CAD: 0.74,
  GBP: 1.27,
  EUR: 1.09,
};

export const SYSTEM_ACTOR = "Rillet automation";
export const DEFAULT_ACTOR = "Maya Chen";
