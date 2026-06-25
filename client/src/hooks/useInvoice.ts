import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Invoice } from "~shared/types";
import { getFallbackInvoice } from "../lib/fallbackData";

async function fetchInvoice(id: string): Promise<Invoice> {
  try {
    const res = await fetch(`/api/invoices/${id}`);
    if (res.status === 404) throw new Error("NOT_FOUND");
    if (!res.ok) throw new Error("Failed to fetch invoice");
    const json = (await res.json()) as { data: Invoice };
    return json.data;
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") throw err;
    return getFallbackInvoice(id);
  }
}

export function invoiceQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["invoices", id],
    queryFn: () => fetchInvoice(id),
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery(invoiceQueryOptions(id));
}
