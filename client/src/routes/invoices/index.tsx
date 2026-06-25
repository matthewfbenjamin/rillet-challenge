import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Group, Switch, Text } from "@mantine/core";
import { InvoiceUIProvider, useInvoiceUI } from "../../context/InvoiceUIContext";
import { useInvoices } from "../../hooks/useInvoices";
import { InvoiceTable } from "../../components/invoice-list/InvoiceTable";
import { ListSummaryBar } from "../../components/invoice-list/ListSummaryBar";

export const Route = createFileRoute("/invoices/")({
  component: InvoiceListWrapper,
});

function InvoiceListWrapper() {
  return (
    <InvoiceUIProvider>
      <InvoiceListPage />
    </InvoiceUIProvider>
  );
}

function InvoiceListPage() {
  const { state, dispatch } = useInvoiceUI();
  const { data, isLoading } = useInvoices();

  const invoices = data?.data ?? [];
  const voidedCount = data?.meta.voided ?? 0;

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text fw={600} fz="xl">Invoices</Text>
        <Group gap="sm">
          <Switch
            label={
              <Text fz="sm">
                Show voided
                {voidedCount > 0 && (
                  <Text span c="dimmed" fz="xs" ml={4}>
                    ({voidedCount})
                  </Text>
                )}
              </Text>
            }
            checked={state.showVoided}
            onChange={() => dispatch({ type: "TOGGLE_VOIDED" })}
          />
        </Group>
      </Group>

      {!isLoading && invoices.length > 0 && <ListSummaryBar invoices={invoices} />}

      <InvoiceTable invoices={invoices} isLoading={isLoading} />
    </>
  );
}
