import { describe, expect, it } from "vitest";
import { convertToUSD } from "../../lib/fxRates";

describe("convertToUSD", () => {
  it("returns the same amount for USD", () => {
    expect(convertToUSD(100, "USD")).toBe(100);
  });

  it("converts CAD to USD", () => {
    expect(convertToUSD(100, "CAD")).toBeCloseTo(74);
  });

  it("converts GBP to USD", () => {
    expect(convertToUSD(100, "GBP")).toBeCloseTo(127);
  });

  it("converts EUR to USD", () => {
    expect(convertToUSD(100, "EUR")).toBeCloseTo(109);
  });

  it("returns null for unknown currency", () => {
    expect(convertToUSD(100, "JPY")).toBeNull();
    expect(convertToUSD(100, "")).toBeNull();
  });

  it("handles zero amount", () => {
    expect(convertToUSD(0, "USD")).toBe(0);
    expect(convertToUSD(0, "GBP")).toBe(0);
  });
});
