import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { notifications } from "@mantine/notifications";
import { Skeleton, Stack, Title } from "@mantine/core";
import { useEffect } from "react";
import type { z } from "zod";
import type { CreateInvoiceSchema } from "~shared/schemas";
import { InvoiceForm } from "../../components/invoice-form/InvoiceForm";
import { useCreateInvoice } from "../../hooks/useCreateInvoice";
import { useNextInvoiceNumber } from "../../hooks/useNextInvoiceNumber";

export const Route = createFileRoute("/invoices/new")({
  component: CreateInvoicePage,
});

function CreateInvoicePage() {
  const navigate = useNavigate();
  const { data: nextNumber, isLoading: numberLoading } = useNextInvoiceNumber();
  const { mutate: createInvoice, isPending } = useCreateInvoice();

  useEffect(() => {
    if (nextNumber === undefined && !numberLoading) {
      notifications.show({
        message: "Could not pre-load invoice number. You can enter one manually.",
        color: "yellow",
      });
    }
  }, [nextNumber, numberLoading]);

  function handleSubmit(data: z.infer<typeof CreateInvoiceSchema>) {
    createInvoice(data, {
      onSuccess: (invoice) => {
        notifications.show({
          message: `Invoice ${invoice.invoiceNumber} created`,
          color: "green",
        });
        void navigate({ to: "/invoices/$invoiceId", params: { invoiceId: invoice.id } });
      },
      onError: (err) => {
        notifications.show({
          message: err.message,
          color: "red",
          title: "Failed to create invoice",
        });
      },
    });
  }

  if (numberLoading) {
    return (
      <Stack>
        <Skeleton height={28} width={180} />
        <Skeleton height={400} mt="md" />
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={3}>New Invoice</Title>
      <InvoiceForm
        mode="create"
        defaultValues={nextNumber ? { invoiceNumber: nextNumber } : undefined}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
      />
    </Stack>
  );
}
