import { useWatch, type Control } from "react-hook-form";
import { useMemo } from "react";
import { computeTotals } from "../lib/totals";
import type { DerivedTotals, LineItem } from "~shared/types";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";

type FormValues = z.infer<typeof CreateInvoiceSchema>;

export function useDerivedTotals(control: Control<FormValues>): DerivedTotals {
  const lineItems = useWatch({ control, name: "lineItems" }) as LineItem[];
  const discount = useWatch({ control, name: "discount" }) as number;
  const taxRate = useWatch({ control, name: "taxRate" }) as number;

  return useMemo(
    () => computeTotals(lineItems ?? [], discount ?? 0, taxRate ?? 0),
    [lineItems, discount, taxRate],
  );
}
