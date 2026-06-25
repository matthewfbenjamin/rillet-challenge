import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/")({
  component: InvoiceListPage,
});

function InvoiceListPage() {
  return <div>Invoice List (coming in Phase 6)</div>;
}
