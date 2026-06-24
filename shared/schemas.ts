import { z } from "zod";

export const LineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, "Description required"),
  quantity: z.number().positive("Must be > 0"),
  unitPrice: z.number().min(0, "Must be ≥ 0"),
  accountCode: z.string().min(1, "Account code required"),
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerName: z.string().min(1),
  billingEmail: z.string().email(),
  billingAddress: z.string().min(1),
  paymentTerms: z.string().min(1),
  currency: z.string().length(3),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  amountPaid: z.number().min(0).optional(),
  memo: z.string(),
  taxRate: z.number().min(0).max(1),
  discount: z.number().min(0),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item required"),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const TransitionSchema = z.object({
  action: z.enum(["send", "recordPayment", "recordPartialPayment", "void"]),
  paidDate: z.string().optional(),
  amountPaid: z.number().positive().optional(),
  actor: z.string().default("Maya Chen"),
}).superRefine((d, ctx) => {
  if (d.action === "recordPayment" && !d.paidDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "paidDate required for recordPayment",
      path: ["paidDate"],
    });
  }
  if (d.action === "recordPartialPayment" && d.amountPaid === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "amountPaid required for recordPartialPayment",
      path: ["amountPaid"],
    });
  }
});

export const AssistantParseRequestSchema = z.object({
  text: z.string().min(1).max(4000),
});

export const AssistantDraftResponseSchema = z.object({
  draft: CreateInvoiceSchema.partial(),
  needsReview: z.array(z.string()).default([]),
});
