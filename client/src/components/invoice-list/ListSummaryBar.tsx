import { Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import type { InvoiceListItem } from "~shared/types";
import { convertToUSD } from "../../lib/fxRates";
import { formatCurrency } from "../../lib/formatters";

interface ListSummaryBarProps {
  invoices: InvoiceListItem[];
}

function aggregateUSD(
  invoices: InvoiceListItem[],
  filter: (inv: InvoiceListItem) => boolean,
  getAmount: (inv: InvoiceListItem) => number,
): { amount: number; hasNonUSD: boolean } {
  let amount = 0;
  let hasNonUSD = false;
  for (const inv of invoices) {
    if (!filter(inv)) continue;
    const usd = convertToUSD(getAmount(inv), inv.currency);
    if (usd !== null) {
      amount += usd;
      if (inv.currency !== "USD") hasNonUSD = true;
    }
  }
  return { amount, hasNonUSD };
}

interface SummaryItemProps {
  label: string;
  amount: number;
  hasNonUSD: boolean;
  color?: string;
}

function SummaryItem({ label, amount, hasNonUSD, color }: SummaryItemProps) {
  return (
    <Stack gap={2} align="center">
      <Text fz="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>
        {label}
      </Text>
      <Tooltip label="Approximate USD conversion" disabled={!hasNonUSD} position="top" withArrow>
        <Text fz="sm" fw={600} c={color} style={{ fontVariantNumeric: "tabular-nums" }}>
          {hasNonUSD ? "~" : ""}{formatCurrency(amount, "USD")}
        </Text>
      </Tooltip>
    </Stack>
  );
}

export function ListSummaryBar({ invoices }: ListSummaryBarProps) {
  const open = aggregateUSD(
    invoices,
    (inv) => inv.paymentStatus === "Open",
    (inv) => inv.invoiceTotal,
  );
  const overdue = aggregateUSD(
    invoices,
    (inv) => inv.paymentStatus === "Overdue",
    (inv) => inv.invoiceTotal,
  );
  const paid = aggregateUSD(
    invoices,
    (inv) => inv.paymentStatus === "Paid",
    (inv) => inv.amountPaid ?? inv.invoiceTotal,
  );

  return (
    <Paper withBorder p="sm" mb="md">
      <Group justify="space-around">
        <SummaryItem label="Open" amount={open.amount} hasNonUSD={open.hasNonUSD} />
        <SummaryItem label="Overdue" amount={overdue.amount} hasNonUSD={overdue.hasNonUSD} color="red" />
        <SummaryItem label="Paid" amount={paid.amount} hasNonUSD={paid.hasNonUSD} color="green" />
      </Group>
    </Paper>
  );
}
