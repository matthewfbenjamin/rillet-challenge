import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/$invoiceId/edit")({
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { invoiceId } = Route.useParams();
  return <div>Edit Invoice: {invoiceId} (coming in Phase 10)</div>;
}
