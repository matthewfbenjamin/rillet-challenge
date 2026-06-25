import { FX_RATES_TO_USD } from "~shared/constants";

export function convertToUSD(amount: number, currency: string): number | null {
  const rate = FX_RATES_TO_USD[currency];
  if (rate === undefined) return null;
  return amount * rate;
}

export function convertBetween(
  amount: number,
  from: string,
  to: string,
): number | null {
  if (from === to) return amount;
  const usd = convertToUSD(amount, from);
  if (usd === null) return null;
  if (to === "USD") return usd;
  const toRate = FX_RATES_TO_USD[to];
  if (toRate === undefined) return null;
  return usd / toRate;
}

export const SUPPORTED_CURRENCIES = Object.keys(FX_RATES_TO_USD) as string[];
