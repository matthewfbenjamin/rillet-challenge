import { FX_RATES_TO_USD } from "~shared/constants";

export function convertToUSD(amount: number, currency: string): number | null {
  const rate = FX_RATES_TO_USD[currency];
  if (rate === undefined) return null;
  return amount * rate;
}
