import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type { UpdateInvoiceSchema } from "~shared/schemas";
import type { Invoice } from "~shared/types";

type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

async function updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to update invoice");
  }
  const json = (await res.json()) as { data: Invoice };
  return json.data;
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInvoiceInput) => updateInvoice(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
