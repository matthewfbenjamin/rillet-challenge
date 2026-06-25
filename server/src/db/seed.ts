import { db } from "./database.js";
import { readFileSync } from "node:fs";
import { nanoid } from "nanoid";

export function seed() {
  const row = db.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number };
  if (row.count > 0) return;

  const jsonPath = new URL("../../../invoices.json", import.meta.url);
  const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const invoices: Array<Record<string, unknown>> = raw.invoices;

  const insert = db.prepare(`
    INSERT INTO invoices (
      id, invoiceNumber, customerName, billingEmail, billingAddress,
      paymentTerms, status, paymentStatus, currency, issueDate, dueDate,
      paidDate, memo, taxRate, discount, amountPaid, lineItems, activity,
      createdAt, updatedAt
    ) VALUES (
      @id, @invoiceNumber, @customerName, @billingEmail, @billingAddress,
      @paymentTerms, @status, @paymentStatus, @currency, @issueDate, @dueDate,
      @paidDate, @memo, @taxRate, @discount, @amountPaid, @lineItems, @activity,
      @createdAt, @updatedAt
    )
  `);

  const insertMany = db.transaction((rows: Array<Record<string, unknown>>) => {
    for (const row of rows) {
      insert.run(row);
    }
  });

  const now = new Date().toISOString();

  const rows = invoices.map((invoice) => {
    const activity = invoice.activity as Array<{ timestamp: string }>;
    const lineItems = invoice.lineItems;

    const createdAt = activity.length > 0 ? activity[0].timestamp : now;
    const updatedAt = activity.length > 0 ? activity[activity.length - 1].timestamp : now;

    const paymentStatus = invoice.paymentStatus as string;

    return {
      id: (invoice.id as string) ?? nanoid(),
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      billingEmail: invoice.billingEmail,
      billingAddress: invoice.billingAddress,
      paymentTerms: invoice.paymentTerms,
      status: invoice.status,
      paymentStatus: paymentStatus,
      currency: invoice.currency ?? "USD",
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: (invoice.paidDate as string | undefined) ?? null,
      memo: invoice.memo ?? "",
      taxRate: invoice.taxRate ?? 0,
      discount: invoice.discount ?? 0,
      amountPaid: (invoice.amountPaid as number | undefined) ?? null,
      lineItems: JSON.stringify(lineItems),
      activity: JSON.stringify(activity),
      createdAt,
      updatedAt,
    };
  });

  insertMany(rows);
}
