import { Stack, Text } from "@mantine/core";
import { CurrencyDisplay } from "../common/CurrencyDisplay";
import { convertToUSD } from "../../lib/fxRates";
import { formatCurrency } from "../../lib/formatters";

interface AmountCellProps {
  amount: number;
  currency: string;
}

export function AmountCell({ amount, currency }: AmountCellProps) {
  const usd = currency !== "USD" ? convertToUSD(amount, currency) : null;

  return (
    <Stack gap={0} align="flex-end">
      <CurrencyDisplay amount={amount} currency={currency} fz="sm" />
      {usd !== null && (
        <Text fz="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
          ~{formatCurrency(usd, "USD")}
        </Text>
      )}
    </Stack>
  );
}
