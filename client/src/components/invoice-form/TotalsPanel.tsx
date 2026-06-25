import { Divider, Group, Stack, Text } from "@mantine/core";
import type { Control } from "react-hook-form";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";
import { useDerivedTotals } from "../../hooks/useDerivedTotals";
import { formatCurrency } from "../../lib/formatters";
import { useWatch } from "react-hook-form";

type FormValues = z.infer<typeof CreateInvoiceSchema>;

interface TotalsPanelProps {
  control: Control<FormValues>;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Group justify="space-between">
      <Text fz="sm" fw={bold ? 700 : undefined} c={bold ? undefined : "dimmed"}>{label}</Text>
      <Text fz="sm" fw={bold ? 700 : undefined} style={{ fontVariantNumeric: "tabular-nums" }}>{value}</Text>
    </Group>
  );
}

export function TotalsPanel({ control }: TotalsPanelProps) {
  const { subtotal, discounted, tax, total } = useDerivedTotals(control);
  const currency = useWatch({ control, name: "currency" }) as string ?? "USD";
  const discount = useWatch({ control, name: "discount" }) as number ?? 0;
  const taxRate = useWatch({ control, name: "taxRate" }) as number ?? 0;

  return (
    <Stack gap="xs" maw={280} ml="auto">
      <Row label="Subtotal" value={formatCurrency(subtotal, currency)} />
      {discount > 0 && (
        <Row label="Discount" value={`-${formatCurrency(discount, currency)}`} />
      )}
      {taxRate > 0 && (
        <Row label={`Tax (${(taxRate * 100).toFixed(0)}%)`} value={formatCurrency(tax, currency)} />
      )}
      <Divider />
      <Row label="Total" value={formatCurrency(total, currency)} bold />
    </Stack>
  );
}
