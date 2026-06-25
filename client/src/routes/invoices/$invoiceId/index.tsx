import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/$invoiceId/")({
  component: InvoiceDetailPage,
});

function InvoiceDetailPage() {
  const { invoiceId } = Route.useParams();
  return <div>Invoice Detail: {invoiceId} (coming in Phase 7)</div>;
}
