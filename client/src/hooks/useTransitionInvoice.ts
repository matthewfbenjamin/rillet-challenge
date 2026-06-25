import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice } from "~shared/types";

interface TransitionInput {
  action: string;
  paidDate?: string;
  amountPaid?: number;
}

async function transitionInvoice(id: string, input: TransitionInput): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Transition failed");
  }
  const json = (await res.json()) as { data: Invoice };
  return json.data;
}

export function useTransitionInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransitionInput) => transitionInvoice(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
