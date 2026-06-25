import { useMutation, useQueryClient } from "@tanstack/react-query";

async function voidInvoice(id: string): Promise<void> {
  const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to void invoice");
  }
}

export function useVoidInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => voidInvoice(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
