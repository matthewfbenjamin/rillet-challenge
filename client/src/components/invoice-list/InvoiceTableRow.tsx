import { Table, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import type { InvoiceListItem } from "~shared/types";
import { StatusBadge } from "./StatusBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { DueDateCell } from "./DueDateCell";
import { AmountCell } from "./AmountCell";
import { formatDate } from "../../lib/formatters";

interface InvoiceTableRowProps {
  invoice: InvoiceListItem;
}

export function InvoiceTableRow({ invoice }: InvoiceTableRowProps) {
  const navigate = useNavigate();

  return (
    <Table.Tr
      style={{ cursor: "pointer" }}
      onClick={() => navigate({ to: "/invoices/$invoiceId", params: { invoiceId: invoice.id } })}
    >
      <Table.Td>
        <Text fz="sm" ff="monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
          {invoice.invoiceNumber}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz="sm" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={invoice.customerName}>
          {invoice.customerName}
        </Text>
      </Table.Td>
      <Table.Td>
        <StatusBadge status={invoice.status} />
      </Table.Td>
      <Table.Td>
        <PaymentStatusBadge status={invoice.paymentStatus} />
      </Table.Td>
      <Table.Td>
        <DueDateCell dueDate={invoice.dueDate} paymentStatus={invoice.paymentStatus} />
      </Table.Td>
      <Table.Td>
        <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatDate(invoice.issueDate)}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: "right" }}>
        <AmountCell amount={invoice.invoiceTotal} currency={invoice.currency} />
      </Table.Td>
    </Table.Tr>
  );
}
