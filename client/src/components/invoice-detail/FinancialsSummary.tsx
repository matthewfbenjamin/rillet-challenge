import { Divider, Group, Stack, Text } from "@mantine/core";
import type { Invoice } from "~shared/types";
import { computeTotals } from "../../lib/totals";
import { formatCurrency } from "../../lib/formatters";
import { convertBetween } from "../../lib/fxRates";

interface FinancialsSummaryProps {
  invoice: Invoice;
  displayCurrency: string;
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <Group justify="space-between">
      <Text fz="sm" fw={bold ? 700 : undefined} c={color}>{label}</Text>
      <Text fz="sm" fw={bold ? 700 : undefined} c={color} style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Text>
    </Group>
  );
}

export function FinancialsSummary({ invoice, displayCurrency }: FinancialsSummaryProps) {
  const { subtotal, discounted, tax, total } = computeTotals(
    invoice.lineItems,
    invoice.discount,
    invoice.taxRate,
  );

  function fmt(amount: number) {
    const converted = convertBetween(amount, invoice.currency, displayCurrency);
    const display = converted ?? amount;
    const currency = converted !== null ? displayCurrency : invoice.currency;
    return formatCurrency(display, currency);
  }

  return (
    <Stack gap="xs" maw={320} ml="auto" mb="lg">
      <Row label="Subtotal" value={fmt(subtotal)} />
      {invoice.discount > 0 && (
        <Row label="Discount" value={`-${fmt(invoice.discount)}`} color="dimmed" />
      )}
      {invoice.taxRate > 0 && (
        <Row label={`Tax (${(invoice.taxRate * 100).toFixed(0)}%)`} value={fmt(tax)} color="dimmed" />
      )}
      <Divider />
      <Row label="Total" value={fmt(total)} bold />
    </Stack>
  );
}
