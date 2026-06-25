import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Invoice } from "~shared/types";

async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error("Failed to fetch invoice");
  const json = (await res.json()) as { data: Invoice };
  return json.data;
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
