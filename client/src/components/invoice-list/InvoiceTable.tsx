import { Skeleton, Table } from "@mantine/core";
import type { InvoiceListItem } from "~shared/types";
import { useInvoiceUI } from "../../context/InvoiceUIContext";
import type { SortCol } from "../../context/InvoiceUIContext";
import { InvoiceTableRow } from "./InvoiceTableRow";
import { EmptyInvoiceState } from "./EmptyInvoiceState";

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  isLoading: boolean;
}

type SortableCol = SortCol | null;

const COLUMNS: { key: SortCol | null; label: string; align?: "right" }[] = [
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "customerName", label: "Customer" },
  { key: null, label: "Status" },
  { key: null, label: "Payment" },
  { key: "dueDate", label: "Due Date" },
  { key: null, label: "Issue Date" },
  { key: null, label: "Amount", align: "right" },
];

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  const { state, dispatch } = useInvoiceUI();

  const sorted = [...invoices].sort((a, b) => {
    const col = state.sortCol as keyof InvoiceListItem;
    const av = String(a[col] ?? "");
    const bv = String(b[col] ?? "");
    return state.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <Table highlightOnHover stickyHeader>
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map(({ key, label, align }) => (
            <Table.Th
              key={label}
              style={{
                textAlign: align,
                cursor: key ? "pointer" : undefined,
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
              scope="col"
              onClick={key ? () => dispatch({ type: "SET_SORT", col: key }) : undefined}
            >
              {label}
              {key && state.sortCol === key && (state.sortDir === "asc" ? " ↑" : " ↓")}
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Table.Tr key={i}>
              {COLUMNS.map(({ label }) => (
                <Table.Td key={label}>
                  <Skeleton height={16} radius="sm" />
                </Table.Td>
              ))}
            </Table.Tr>
          ))
        ) : sorted.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={COLUMNS.length}>
              <EmptyInvoiceState />
            </Table.Td>
          </Table.Tr>
        ) : (
          sorted.map((inv) => <InvoiceTableRow key={inv.id} invoice={inv} />)
        )}
      </Table.Tbody>
    </Table>
  );
}
