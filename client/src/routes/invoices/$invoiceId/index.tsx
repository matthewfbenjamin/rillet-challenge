import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Alert, Button, Center, Divider, Group, Skeleton, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { queryClient } from "../../../lib/queryClient";
import { invoiceQueryOptions, useInvoice } from "../../../hooks/useInvoice";
import { getFallbackInvoice } from "../../../lib/fallbackData";
import { useVoidInvoice } from "../../../hooks/useVoidInvoice";
import { InvoiceDetailHeader } from "../../../components/invoice-detail/InvoiceDetailHeader";
import { InvoiceDetailMeta } from "../../../components/invoice-detail/InvoiceDetailMeta";
import { LineItemsTable } from "../../../components/invoice-detail/LineItemsTable";
import { FinancialsSummary } from "../../../components/invoice-detail/FinancialsSummary";
import { ActivityLog } from "../../../components/invoice-detail/ActivityLog";
import { ActionButtons } from "../../../components/invoice-detail/ActionButtons";
import { CurrencyConvertSelect } from "../../../components/invoice-detail/CurrencyConvertSelect";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

export const Route = createFileRoute("/invoices/$invoiceId/")({
  loader: async ({ params }) => {
    try {
      await queryClient.ensureQueryData(invoiceQueryOptions(params.invoiceId));
    } catch (err) {
      const invoice = await getFallbackInvoice(params.invoiceId);
      if (!invoice) throw err;
      queryClient.setQueryData(invoiceQueryOptions(params.invoiceId).queryKey, invoice);
    }
  },
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const { mutate: voidInvoice, isPending: isVoiding } = useVoidInvoice(invoiceId);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Stack>
        <Skeleton height={32} width={200} />
        <Skeleton height={20} width={160} />
        <Skeleton height={120} mt="md" />
        <Skeleton height={80} mt="md" />
      </Stack>
    );
  }

  if (error || !invoice) {
    const is404 = error?.message === "NOT_FOUND";
    return (
      <Center py={80}>
        <Stack align="center" gap="md">
          <Alert color="red" title={is404 ? "Invoice not found" : "Failed to load invoice"}>
            {is404
              ? "This invoice doesn't exist or may have been removed."
              : "Something went wrong. Please try again."}
          </Alert>
          <Button component={Link} to="/invoices" variant="subtle">
            Back to invoices
          </Button>
        </Stack>
      </Center>
    );
  }

  const activeCurrency = displayCurrency ?? invoice.currency;

  function handleVoidConfirm() {
    voidInvoice(undefined, {
      onSuccess: () => {
        notifications.show({
          message: "Invoice voided",
          color: "orange",
        });
        void navigate({ to: "/invoices" });
      },
      onError: (err) => {
        notifications.show({
          message: err.message,
          color: "red",
          title: "Failed to void invoice",
        });
        setVoidModalOpen(false);
      },
    });
  }

  return (
    <Stack>
      <ConfirmModal
        opened={voidModalOpen}
        title="Void invoice"
        message={`This will void ${invoice.invoiceNumber} and cannot be undone. The invoice will remain in your records for audit purposes.`}
        confirmLabel="Void invoice"
        isLoading={isVoiding}
        onConfirm={handleVoidConfirm}
        onCancel={() => setVoidModalOpen(false)}
      />
      <Group justify="space-between" align="flex-start">
        <Button component={Link} to="/invoices" variant="subtle" size="sm" px={0}>
          ← Invoices
        </Button>
        <Group gap="sm">
          <CurrencyConvertSelect
            value={activeCurrency}
            onChange={setDisplayCurrency}
          />
          <ActionButtons invoice={invoice} />
          {invoice.status !== "Void" && (
            <Button
              variant="outline"
              color="red"
              size="sm"
              onClick={() => setVoidModalOpen(true)}
            >
              Void
            </Button>
          )}
          <Link to="/invoices/$invoiceId/edit" params={{ invoiceId: invoice.id }}>
            <Button
              variant="default"
              size="sm"
              disabled={invoice.status === "Void"}
            >
              Edit
            </Button>
          </Link>
        </Group>
      </Group>

      <InvoiceDetailHeader invoice={invoice} />
      <Divider />
      <InvoiceDetailMeta invoice={invoice} displayCurrency={activeCurrency} />
      <Divider />
      <LineItemsTable
        lineItems={invoice.lineItems}
        currency={invoice.currency}
        displayCurrency={activeCurrency}
      />
      <FinancialsSummary invoice={invoice} displayCurrency={activeCurrency} />
      {invoice.memo && (
        <>
          <Divider />
          <Stack gap={4}>
            <Text fz="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>
              Memo
            </Text>
            <Text fz="sm">{invoice.memo}</Text>
          </Stack>
        </>
      )}
      <Divider />
      <ActivityLog activity={invoice.activity} />
    </Stack>
  );
}
