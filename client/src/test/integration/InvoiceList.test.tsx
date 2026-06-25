import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceUIProvider } from "../../context/InvoiceUIContext";
import { InvoiceTable } from "../../components/invoice-list/InvoiceTable";
import type { InvoiceListItem } from "~shared/types";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
      <a {...props}>{children}</a>
    ),
  };
});

const makeInvoice = (overrides: Partial<InvoiceListItem>): InvoiceListItem => ({
  id: "inv-1",
  invoiceNumber: "INV-2026-0001",
  customerName: "Acme Corp",
  billingEmail: "billing@acme.com",
  billingAddress: "123 Main St",
  paymentTerms: "Net 30",
  status: "Sent",
  paymentStatus: "Open",
  currency: "USD",
  issueDate: "2026-01-01",
  dueDate: "2026-01-31",
  taxRate: 0.1,
  discount: 0,
  invoiceTotal: 1000,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const OVERDUE_INVOICE = makeInvoice({
  id: "inv-2",
  invoiceNumber: "INV-2026-0002",
  customerName: "Overdue Co",
  paymentStatus: "Overdue",
  dueDate: "2020-01-01",
});

const VOIDED_INVOICE = makeInvoice({
  id: "inv-3",
  invoiceNumber: "INV-2026-0003",
  customerName: "Voided Inc",
  status: "Void",
  paymentStatus: "Voided",
});

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <MantineProvider>
      <QueryClientProvider client={qc}>
        <InvoiceUIProvider>{children}</InvoiceUIProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}

describe("InvoiceTable", () => {
  it("renders rows from mock data", () => {
    render(
      <Wrapper>
        <InvoiceTable invoices={[makeInvoice({})]} isLoading={false} />
      </Wrapper>,
    );
    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("shows overdue warning icon for overdue rows", () => {
    render(
      <Wrapper>
        <InvoiceTable invoices={[OVERDUE_INVOICE]} isLoading={false} />
      </Wrapper>,
    );
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("does not show warning icon for paid invoices", () => {
    const paid = makeInvoice({ paymentStatus: "Paid", dueDate: "2020-01-01" });
    render(
      <Wrapper>
        <InvoiceTable invoices={[paid]} isLoading={false} />
      </Wrapper>,
    );
    expect(screen.queryByText("⚠")).not.toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      <Wrapper>
        <InvoiceTable invoices={[]} isLoading={true} />
      </Wrapper>,
    );
    const skeletons = container.querySelectorAll(".mantine-Skeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no invoices", () => {
    render(
      <Wrapper>
        <InvoiceTable invoices={[]} isLoading={false} />
      </Wrapper>,
    );
    expect(screen.getByText("No invoices yet")).toBeInTheDocument();
  });
});
