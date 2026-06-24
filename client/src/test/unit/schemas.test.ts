import { describe, it, expect } from "vitest";
import { CreateInvoiceSchema, TransitionSchema } from "~shared/schemas";

const validLineItem = {
  id: "li-1",
  description: "Monthly subscription",
  quantity: 1,
  unitPrice: 500,
  accountCode: "4000",
};

const validPayload = {
  invoiceNumber: "INV-0001",
  customerName: "Acme Corp",
  billingEmail: "billing@acme.com",
  billingAddress: "123 Main St, Springfield, IL 62701",
  paymentTerms: "Net 30",
  currency: "USD",
  issueDate: "2026-06-01",
  dueDate: "2026-07-01",
  paidDate: null,
  memo: "Thanks for your business.",
  taxRate: 0.085,
  discount: 0,
  lineItems: [validLineItem],
};

describe("CreateInvoiceSchema", () => {
  it("valid payload passes", () => {
    const result = CreateInvoiceSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("missing customerName fails with error on customerName field", () => {
    const payload = { ...validPayload, customerName: "" };
    const result = CreateInvoiceSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("customerName");
    }
  });

  it("invalid email fails with error on billingEmail field", () => {
    const payload = { ...validPayload, billingEmail: "not-an-email" };
    const result = CreateInvoiceSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("billingEmail");
    }
  });

  it("empty lineItems array fails with 'At least one line item required'", () => {
    const payload = { ...validPayload, lineItems: [] };
    const result = CreateInvoiceSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("At least one line item required");
    }
  });
});

describe("TransitionSchema", () => {
  it("action=recordPayment without paidDate → refine fires, error on paidDate", () => {
    const result = TransitionSchema.safeParse({ action: "recordPayment" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("paidDate");
    }
  });

  it("action=recordPayment with paidDate present → passes", () => {
    const result = TransitionSchema.safeParse({
      action: "recordPayment",
      paidDate: "2026-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("action=send without paidDate → passes", () => {
    const result = TransitionSchema.safeParse({ action: "send" });
    expect(result.success).toBe(true);
  });

  it("action=recordPartialPayment with amountPaid → passes", () => {
    const result = TransitionSchema.safeParse({
      action: "recordPartialPayment",
      amountPaid: 500,
    });
    expect(result.success).toBe(true);
  });

  it("action=recordPartialPayment without amountPaid → fails with error on amountPaid", () => {
    const result = TransitionSchema.safeParse({ action: "recordPartialPayment" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("amountPaid");
    }
  });
});

describe("CreateInvoiceSchema — amountPaid", () => {
  it("with amountPaid present → passes", () => {
    const result = CreateInvoiceSchema.safeParse({ ...validPayload, amountPaid: 100 });
    expect(result.success).toBe(true);
  });

  it("without amountPaid → passes (optional)", () => {
    const result = CreateInvoiceSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
