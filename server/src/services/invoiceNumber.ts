import { db } from "../db/database.js";

export function generateInvoiceNumber(): string {
  const rows = db.prepare("SELECT invoiceNumber FROM invoices").all() as { invoiceNumber: string }[];
  const year = new Date().getFullYear();
  let max = 0;
  for (const row of rows) {
    const parts = row.invoiceNumber.split("-");
    const suffix = parseInt(parts[2], 10);
    if (!isNaN(suffix) && suffix > max) max = suffix;
  }
  const next = String(max + 1).padStart(4, "0");
  return `INV-${year}-${next}`;
}
