import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { notifications } from "@mantine/notifications";
import { Alert, Button, Center, Skeleton, Stack, Title } from "@mantine/core";
import type { z } from "zod";
import type { UpdateInvoiceSchema } from "~shared/schemas";
import { InvoiceForm } from "../../../components/invoice-form/InvoiceForm";
import { invoiceQueryOptions, useInvoice } from "../../../hooks/useInvoice";
import { useUpdateInvoice } from "../../../hooks/useUpdateInvoice";
import { queryClient } from "../../../lib/queryClient";

export const Route = createFileRoute("/invoices/$invoiceId/edit")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(invoiceQueryOptions(params.invoiceId)),
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { invoiceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const { mutate: updateInvoice, isPending } = useUpdateInvoice(invoiceId);

  function handleSubmit(data: z.infer<typeof UpdateInvoiceSchema>) {
    updateInvoice(data, {
      onSuccess: () => {
        notifications.show({
          message: "Invoice updated",
          color: "green",
        });
        void navigate({ to: "/invoices/$invoiceId", params: { invoiceId } });
      },
      onError: (err) => {
        notifications.show({
          message: err.message,
          color: "red",
          title: "Failed to update invoice",
        });
      },
    });
  }

  if (isLoading) {
    return (
      <Stack>
        <Skeleton height={28} width={180} />
        <Skeleton height={400} mt="md" />
      </Stack>
    );
  }

  if (error || !invoice) {
    return (
      <Center py={80}>
        <Alert color="red" title="Failed to load invoice">
          Could not load invoice data for editing.
        </Alert>
      </Center>
    );
  }

  return (
    <Stack>
      <Title order={3}>Edit {invoice.invoiceNumber}</Title>
      <InvoiceForm
        mode="edit"
        defaultValues={{
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          billingEmail: invoice.billingEmail,
          billingAddress: invoice.billingAddress,
          paymentTerms: invoice.paymentTerms,
          currency: invoice.currency,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          taxRate: invoice.taxRate,
          discount: invoice.discount,
          memo: invoice.memo,
          lineItems: invoice.lineItems,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </Stack>
  );
}
