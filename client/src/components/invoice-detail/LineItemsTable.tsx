import { Table, Text } from "@mantine/core";
import type { LineItem } from "~shared/types";
import { formatCurrency } from "../../lib/formatters";
import { convertBetween } from "../../lib/fxRates";

interface LineItemsTableProps {
  lineItems: LineItem[];
  currency: string;
  displayCurrency: string;
}

export function LineItemsTable({ lineItems, currency, displayCurrency }: LineItemsTableProps) {
  function fmt(amount: number) {
    const converted = convertBetween(amount, currency, displayCurrency);
    return formatCurrency(converted ?? amount, converted !== null ? displayCurrency : currency);
  }

  return (
    <Table mb="lg" withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Description</Table.Th>
          <Table.Th scope="col" style={{ textAlign: "right" }}>Qty</Table.Th>
          <Table.Th scope="col" style={{ textAlign: "right" }}>Unit Price</Table.Th>
          <Table.Th scope="col">Account Code</Table.Th>
          <Table.Th scope="col" style={{ textAlign: "right" }}>Amount</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {lineItems.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>{item.description}</Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                {item.quantity.toLocaleString()}
              </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmt(item.unitPrice)}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text fz="sm" c="dimmed">{item.accountCode}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Text fz="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmt(item.quantity * item.unitPrice)}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
