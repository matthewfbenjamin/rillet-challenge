import { nanoid } from "nanoid";
import { db } from "../db/database.js";
import { generateInvoiceNumber } from "./invoiceNumber.js";
import { STATUS_TRANSITIONS, DEFAULT_ACTOR } from "~shared/constants.js";
import type { Invoice, InvoiceListItem, LineItem, ActivityEvent } from "~shared/types.js";
import { computeTotals } from "../lib/totals.js";
import type { z } from "zod";
import type { CreateInvoiceSchema, UpdateInvoiceSchema } from "~shared/schemas.js";

type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

function parseInvoiceRow(row: Record<string, unknown>): Invoice {
  return {
    ...(row as Omit<Invoice, "lineItems" | "activity">),
    lineItems: typeof row.lineItems === "string"
      ? (JSON.parse(row.lineItems) as LineItem[])
      : (row.lineItems as LineItem[]),
    activity: typeof row.activity === "string"
      ? (JSON.parse(row.activity) as ActivityEvent[])
      : (row.activity as ActivityEvent[]),
  } as Invoice;
}

export function listInvoices(includeVoided: boolean): {
  data: InvoiceListItem[];
  meta: { total: number; voided: number };
} {
  const rawRows = db
    .prepare(
      `SELECT id, invoiceNumber, customerName, billingEmail, billingAddress, paymentTerms,
              status, paymentStatus, currency, issueDate, dueDate, paidDate, taxRate,
              discount, amountPaid, lineItems, createdAt, updatedAt
       FROM invoices
       ORDER BY updatedAt DESC`
    )
    .all() as Array<Omit<InvoiceListItem, "invoiceTotal"> & { lineItems: string }>;

  const allRows: InvoiceListItem[] = rawRows.map((row) => {
    const lineItems = JSON.parse(row.lineItems) as LineItem[];
    const { total: invoiceTotal } = computeTotals(lineItems, row.discount, row.taxRate);
    const { lineItems: _li, ...rest } = row;
    return { ...rest, invoiceTotal };
  });

  const total = allRows.length;
  const voided = allRows.filter((r) => r.status === "Void").length;

  const data = includeVoided ? allRows : allRows.filter((r) => r.status !== "Void");

  return { data, meta: { total, voided } };
}

export function getInvoiceById(id: string): Invoice | null {
  const row = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return parseInvoiceRow(row);
}

export function createInvoice(
  data: CreateInvoiceInput,
  actor: string = DEFAULT_ACTOR
): Invoice {
  const id = nanoid();
  const invoiceNumber = generateInvoiceNumber();
  const status = "Draft";
  const paymentStatus = "Unsent";
  const now = new Date().toISOString();

  const firstEvent: ActivityEvent = {
    id: nanoid(),
    timestamp: now,
    actor,
    action: "Created invoice",
  };

  const lineItemsJson = JSON.stringify(data.lineItems);
  const activityJson = JSON.stringify([firstEvent]);

  db.prepare(
    `INSERT INTO invoices (
      id, invoiceNumber, customerName, billingEmail, billingAddress, paymentTerms,
      status, paymentStatus, currency, issueDate, dueDate, paidDate, memo, taxRate,
      discount, amountPaid, lineItems, activity, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )`
  ).run(
    id,
    invoiceNumber,
    data.customerName,
    data.billingEmail,
    data.billingAddress,
    data.paymentTerms,
    status,
    paymentStatus,
    data.currency,
    data.issueDate,
    data.dueDate,
    data.paidDate ?? null,
    data.memo,
    data.taxRate,
    data.discount,
    data.amountPaid ?? null,
    lineItemsJson,
    activityJson,
    now,
    now
  );

  return getInvoiceById(id)!;
}

export function updateInvoice(
  id: string,
  data: UpdateInvoiceInput,
  actor: string = DEFAULT_ACTOR
): Invoice {
  const existing = getInvoiceById(id);
  if (!existing) {
    const err = new Error("Invoice not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  const now = new Date().toISOString();

  // Merge fields — ignore status and paymentStatus from incoming data
  const { status: _s, paymentStatus: _ps, ...safeData } = data as UpdateInvoiceInput & {
    status?: unknown;
    paymentStatus?: unknown;
  };

  const merged = { ...existing, ...safeData };

  const newEvent: ActivityEvent = {
    id: nanoid(),
    timestamp: now,
    actor,
    action: "Updated invoice",
  };

  const activity = [...existing.activity, newEvent];

  db.prepare(
    `UPDATE invoices SET
      invoiceNumber = ?, customerName = ?, billingEmail = ?, billingAddress = ?,
      paymentTerms = ?, currency = ?, issueDate = ?, dueDate = ?,
      paidDate = ?, memo = ?, taxRate = ?, discount = ?,
      amountPaid = ?, lineItems = ?, activity = ?, updatedAt = ?
    WHERE id = ?`
  ).run(
    merged.invoiceNumber,
    merged.customerName,
    merged.billingEmail,
    merged.billingAddress,
    merged.paymentTerms,
    merged.currency,
    merged.issueDate,
    merged.dueDate,
    merged.paidDate ?? null,
    merged.memo,
    merged.taxRate,
    merged.discount,
    merged.amountPaid ?? null,
    JSON.stringify(merged.lineItems),
    JSON.stringify(activity),
    now,
    id
  );

  return getInvoiceById(id)!;
}

export function transitionInvoice(
  id: string,
  action: string,
  actor: string = DEFAULT_ACTOR,
  paidDate?: string,
  amountPaid?: number
): Invoice {
  const invoice = getInvoiceById(id);
  if (!invoice) {
    const err = new Error("Invoice not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  // Overdue maps to Sent for transition purposes
  const transitionKey =
    invoice.paymentStatus === "Overdue" ? "Sent" : invoice.status;
  const allowed: string[] = STATUS_TRANSITIONS[transitionKey] ?? [];

  if (!allowed.includes(action)) {
    const err = new Error("Invalid transition") as Error & {
      status?: number;
      code?: string;
    };
    err.status = 409;
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  const now = new Date().toISOString();
  let newStatus = invoice.status;
  let newPaymentStatus = invoice.paymentStatus;
  let newPaidDate: string | undefined | null = invoice.paidDate;
  let newAmountPaid: number | undefined = invoice.amountPaid;
  let activityAction: string;

  switch (action) {
    case "send":
      newStatus = "Sent";
      newPaymentStatus = "Open";
      activityAction = "Sent invoice to customer";
      break;
    case "recordPayment":
      newStatus = "Paid";
      newPaymentStatus = "Paid";
      newPaidDate = paidDate ?? now;
      activityAction = "Recorded payment";
      break;
    case "recordPartialPayment":
      newStatus = "Sent";
      newPaymentStatus = "Partial";
      newAmountPaid = amountPaid;
      activityAction = "Recorded partial payment";
      break;
    case "void":
      newStatus = "Void";
      newPaymentStatus = "Voided";
      activityAction = "Voided invoice";
      break;
    default:
      activityAction = action;
  }

  const newEvent: ActivityEvent = {
    id: nanoid(),
    timestamp: now,
    actor,
    action: activityAction,
  };

  const activity = [...invoice.activity, newEvent];

  db.prepare(
    `UPDATE invoices SET
      status = ?, paymentStatus = ?, paidDate = ?, amountPaid = ?,
      activity = ?, updatedAt = ?
    WHERE id = ?`
  ).run(
    newStatus,
    newPaymentStatus,
    newPaidDate ?? null,
    newAmountPaid ?? null,
    JSON.stringify(activity),
    now,
    id
  );

  return getInvoiceById(id)!;
}

export function voidInvoice(id: string, actor: string = DEFAULT_ACTOR): Invoice {
  return transitionInvoice(id, "void", actor);
}
