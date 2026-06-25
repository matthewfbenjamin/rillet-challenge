import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { InvoiceListItem } from "~shared/types";
import { useInvoiceUI } from "../context/InvoiceUIContext";
import { getFallbackInvoiceList } from "../lib/fallbackData";

interface InvoiceListResponse {
  data: InvoiceListItem[];
  meta: { total: number; voided: number };
}

async function fetchInvoices(includeVoided: boolean): Promise<InvoiceListResponse> {
  try {
    const res = await fetch(`/api/invoices?includeVoided=${includeVoided}`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json() as Promise<InvoiceListResponse>;
  } catch {
    return getFallbackInvoiceList(includeVoided);
  }
}

export function useInvoices() {
  const { state } = useInvoiceUI();
  return useQuery({
    queryKey: ["invoices", { includeVoided: state.showVoided }],
    queryFn: () => fetchInvoices(state.showVoided),
    placeholderData: keepPreviousData,
  });
}
