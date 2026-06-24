import type { DerivedTotals, LineItem } from "~shared/types";

export function computeTotals(
  lineItems: LineItem[],
  discount: number,
  taxRate: number,
): DerivedTotals {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const discounted = Math.max(0, subtotal - discount);
  const tax = discounted * taxRate;
  const total = discounted + tax;
  return { subtotal, discounted, tax, total };
}
