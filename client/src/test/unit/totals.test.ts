import { describe, it, expect } from "vitest";
import { computeTotals } from "../../lib/totals";
import type { LineItem } from "~shared/types";

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: "1",
    description: "Item",
    quantity: 1,
    unitPrice: 100,
    accountCode: "4000",
    ...overrides,
  };
}

describe("computeTotals", () => {
  it("zero items → all totals are 0", () => {
    const result = computeTotals([], 0, 0.1);
    expect(result).toEqual({ subtotal: 0, discounted: 0, tax: 0, total: 0 });
  });

  it("zero tax rate → tax is 0 and total equals discounted", () => {
    const items = [makeItem({ quantity: 2, unitPrice: 50 })];
    const result = computeTotals(items, 0, 0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(result.discounted);
    expect(result.subtotal).toBe(100);
    expect(result.discounted).toBe(100);
  });

  it("discount greater than subtotal → discounted clamps to 0", () => {
    const items = [makeItem({ quantity: 1, unitPrice: 50 })];
    const result = computeTotals(items, 200, 0.1);
    expect(result.subtotal).toBe(50);
    expect(result.discounted).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it("large decimal quantities: 1480000 × 0.012 with 8.5% tax", () => {
    const items = [makeItem({ quantity: 1480000, unitPrice: 0.012 })];
    const result = computeTotals(items, 0, 0.085);
    expect(result.subtotal).toBeCloseTo(17760, 5);
    expect(result.tax).toBeCloseTo(1509.6, 5);
    expect(result.total).toBeCloseTo(19269.6, 5);
  });

  it("rounding: quantity=3, unitPrice=0.1 → subtotal is close to 0.3", () => {
    const items = [makeItem({ quantity: 3, unitPrice: 0.1 })];
    const result = computeTotals(items, 0, 0);
    expect(result.subtotal).toBeCloseTo(0.3, 10);
  });

  it("multiple line items are summed correctly", () => {
    const items = [
      makeItem({ id: "1", quantity: 2, unitPrice: 100 }),
      makeItem({ id: "2", quantity: 5, unitPrice: 20 }),
      makeItem({ id: "3", quantity: 1, unitPrice: 50 }),
    ];
    const result = computeTotals(items, 25, 0.1);
    // subtotal = 200 + 100 + 50 = 350
    // discounted = 350 - 25 = 325
    // tax = 325 * 0.1 = 32.5
    // total = 357.5
    expect(result.subtotal).toBe(350);
    expect(result.discounted).toBe(325);
    expect(result.tax).toBeCloseTo(32.5, 10);
    expect(result.total).toBeCloseTo(357.5, 10);
  });
});
