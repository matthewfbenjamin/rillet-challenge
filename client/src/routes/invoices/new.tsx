import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invoices/new")({
  component: CreateInvoicePage,
});

function CreateInvoicePage() {
  return <div>Create Invoice (coming in Phase 9)</div>;
}
