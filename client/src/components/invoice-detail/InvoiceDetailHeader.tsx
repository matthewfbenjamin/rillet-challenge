import { Group, Stack, Text, Title } from "@mantine/core";
import type { Invoice } from "~shared/types";
import { StatusBadge } from "../invoice-list/StatusBadge";
import { PaymentStatusBadge } from "../invoice-list/PaymentStatusBadge";
import { formatDate } from "../../lib/formatters";

interface InvoiceDetailHeaderProps {
  invoice: Invoice;
}

export function InvoiceDetailHeader({ invoice }: InvoiceDetailHeaderProps) {
  return (
    <Stack gap="xs" mb="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text fz="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>
            Invoice
          </Text>
          <Title order={2} ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
            {invoice.invoiceNumber}
          </Title>
          <Text fz="lg" fw={500}>
            {invoice.customerName}
          </Text>
        </Stack>
        <Group gap="xs">
          <StatusBadge status={invoice.status} />
          <PaymentStatusBadge status={invoice.paymentStatus} />
        </Group>
      </Group>

      <Group gap="xl" mt="xs">
        <Stack gap={2}>
          <Text fz="xs" c="dimmed">Issued</Text>
          <Text fz="sm">{formatDate(invoice.issueDate)}</Text>
        </Stack>
        <Stack gap={2}>
          <Text fz="xs" c="dimmed">Due</Text>
          <Text fz="sm">{formatDate(invoice.dueDate)}</Text>
        </Stack>
        {invoice.paidDate && (
          <Stack gap={2}>
            <Text fz="xs" c="dimmed">Paid</Text>
            <Text fz="sm" c="green">{formatDate(invoice.paidDate)}</Text>
          </Stack>
        )}
      </Group>
    </Stack>
  );
}
