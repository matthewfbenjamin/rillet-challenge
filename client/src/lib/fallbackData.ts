import type { Invoice, InvoiceListItem } from "~shared/types";
import { computeTotals } from "./totals";

interface SeedFile {
  invoices: Invoice[];
}

let cache: Invoice[] | null = null;

async function loadSeedInvoices(): Promise<Invoice[]> {
  if (cache) return cache;
  const res = await fetch(`${import.meta.env.BASE_URL}invoices.json`);
  if (!res.ok) throw new Error("Fallback data unavailable");
  const json = (await res.json()) as SeedFile;
  cache = json.invoices;
  return cache;
}

export async function getFallbackInvoiceList(includeVoided: boolean): Promise<{
  data: InvoiceListItem[];
  meta: { total: number; voided: number };
}> {
  const invoices = await loadSeedInvoices();
  const filtered = includeVoided ? invoices : invoices.filter((inv) => inv.status !== "Void");
  const voided = invoices.filter((inv) => inv.status === "Void").length;

  const data: InvoiceListItem[] = filtered.map(({ lineItems, activity, memo: _memo, ...rest }) => {
    const { total: invoiceTotal } = computeTotals(lineItems, rest.discount, rest.taxRate);
    return { ...rest, invoiceTotal, createdAt: rest.createdAt ?? rest.issueDate, updatedAt: rest.updatedAt ?? rest.issueDate };
  });

  return { data, meta: { total: filtered.length, voided } };
}

export async function getFallbackInvoice(id: string): Promise<Invoice> {
  const invoices = await loadSeedInvoices();
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) throw new Error("NOT_FOUND");
  return {
    ...invoice,
    createdAt: invoice.createdAt ?? invoice.issueDate,
    updatedAt: invoice.updatedAt ?? invoice.issueDate,
  };
}
