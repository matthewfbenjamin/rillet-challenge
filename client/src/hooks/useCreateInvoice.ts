import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";
import type { Invoice } from "~shared/types";

type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to create invoice");
  }
  const json = (await res.json()) as { data: Invoice };
  return json.data;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
