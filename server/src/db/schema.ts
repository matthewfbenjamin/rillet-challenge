import { db } from "./database.js";
import type { Database as DatabaseType } from "better-sqlite3";

export function initializeSchema(database: DatabaseType) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id              TEXT PRIMARY KEY,
      invoiceNumber   TEXT NOT NULL UNIQUE,
      customerName    TEXT NOT NULL,
      billingEmail    TEXT NOT NULL,
      billingAddress  TEXT NOT NULL,
      paymentTerms    TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'Draft',
      paymentStatus   TEXT NOT NULL DEFAULT 'Unsent',
      currency        TEXT NOT NULL DEFAULT 'USD',
      issueDate       TEXT NOT NULL,
      dueDate         TEXT NOT NULL,
      paidDate        TEXT,
      memo            TEXT NOT NULL DEFAULT '',
      taxRate         REAL NOT NULL DEFAULT 0,
      discount        REAL NOT NULL DEFAULT 0,
      amountPaid      REAL,
      lineItems       TEXT NOT NULL DEFAULT '[]',
      activity        TEXT NOT NULL DEFAULT '[]',
      createdAt       TEXT NOT NULL,
      updatedAt       TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_status    ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_dueDate   ON invoices(dueDate);
    CREATE INDEX IF NOT EXISTS idx_invoices_updatedAt ON invoices(updatedAt);
  `);
}
