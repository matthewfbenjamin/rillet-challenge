import { Text, type TextProps } from "@mantine/core";
import { formatCurrency } from "../../lib/formatters";

interface CurrencyDisplayProps extends Omit<TextProps, "children"> {
  amount: number;
  currency?: string;
}

export function CurrencyDisplay({ amount, currency = "USD", ...props }: CurrencyDisplayProps) {
  return (
    <Text style={{ fontVariantNumeric: "tabular-nums" }} {...props}>
      {formatCurrency(amount, currency)}
    </Text>
  );
}
