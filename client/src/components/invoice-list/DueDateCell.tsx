import { Group, Text } from "@mantine/core";
import { formatDate } from "../../lib/formatters";
import type { PaymentStatus } from "~shared/types";

interface DueDateCellProps {
  dueDate: string;
  paymentStatus: PaymentStatus;
}

const SETTLED: PaymentStatus[] = ["Paid", "Voided"];

export function DueDateCell({ dueDate, paymentStatus }: DueDateCellProps) {
  const isOverdue =
    !SETTLED.includes(paymentStatus) && dueDate < new Date().toISOString().slice(0, 10);

  if (isOverdue) {
    return (
      <Group gap={4} wrap="nowrap">
        <span aria-hidden style={{ color: "var(--mantine-color-red-6)", fontSize: 14, lineHeight: 1 }}>⚠</span>
        <Text c="red" fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatDate(dueDate)}
        </Text>
      </Group>
    );
  }

  return (
    <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatDate(dueDate)}
    </Text>
  );
}
