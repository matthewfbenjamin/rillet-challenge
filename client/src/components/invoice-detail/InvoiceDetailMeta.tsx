import { SimpleGrid, Stack, Text } from "@mantine/core";
import type { Invoice } from "~shared/types";

interface InvoiceDetailMetaProps {
  invoice: Invoice;
  displayCurrency: string | null;
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text fz="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.04em" }}>
        {label}
      </Text>
      <Text fz="sm">{value}</Text>
    </Stack>
  );
}

export function InvoiceDetailMeta({ invoice, displayCurrency }: InvoiceDetailMetaProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
      <MetaField label="Billing Email" value={invoice.billingEmail} />
      <MetaField label="Payment Terms" value={invoice.paymentTerms} />
      <MetaField label="Billing Address" value={invoice.billingAddress} />
      <MetaField label="Currency" value={displayCurrency || invoice.currency} />
    </SimpleGrid>
  );
}
