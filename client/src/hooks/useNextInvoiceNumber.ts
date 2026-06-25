import { queryOptions, useQuery } from "@tanstack/react-query";

async function fetchNextNumber(): Promise<string> {
  const res = await fetch("/api/invoices/next-number");
  if (!res.ok) throw new Error("Failed to fetch next invoice number");
  const json = (await res.json()) as { invoiceNumber: string };
  return json.invoiceNumber;
}

export function nextNumberQueryOptions() {
  return queryOptions({
    queryKey: ["invoices", "nextNumber"],
    queryFn: fetchNextNumber,
    staleTime: 0,
  });
}

export function useNextInvoiceNumber() {
  return useQuery(nextNumberQueryOptions());
}
