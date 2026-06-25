import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
import { InvoiceForm } from "../../components/invoice-form/InvoiceForm";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const DEFAULT_VALUES = {
  invoiceNumber: "INV-2026-0001",
  customerName: "Acme Corp",
  billingEmail: "billing@acme.com",
  billingAddress: "123 Main St",
  paymentTerms: "Net 30",
  currency: "USD",
  issueDate: "2026-01-01",
  dueDate: "2026-01-31",
  taxRate: 0,
  discount: 0,
  memo: "",
  lineItems: [{ id: "li-1", description: "Consulting", quantity: 1, unitPrice: 100, accountCode: "4100" }],
};

describe("InvoiceForm", () => {
  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <InvoiceForm mode="create" onSubmit={vi.fn()} isSubmitting={false} />
      </Wrapper>,
    );
    await user.click(screen.getByRole("button", { name: /create invoice/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/required|invalid|min/i).length).toBeGreaterThan(0);
    });
  });

  it("calls onSubmit with valid data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Wrapper>
        <InvoiceForm
          mode="create"
          defaultValues={DEFAULT_VALUES}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      </Wrapper>,
    );
    await user.click(screen.getByRole("button", { name: /create invoice/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });

  it("shows amber highlight for needsReview fields", () => {
    render(
      <Wrapper>
        <InvoiceForm
          mode="create"
          defaultValues={DEFAULT_VALUES}
          onSubmit={vi.fn()}
          needsReview={["taxRate", "discount"]}
          isSubmitting={false}
        />
      </Wrapper>,
    );
    const highlights = document.querySelectorAll('[style*="border-left"]');
    expect(highlights.length).toBeGreaterThanOrEqual(2);
  });

  it("adds a line item row when Add is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <InvoiceForm
          mode="create"
          defaultValues={DEFAULT_VALUES}
          onSubmit={vi.fn()}
          isSubmitting={false}
        />
      </Wrapper>,
    );
    const rows = () => document.querySelectorAll("tbody tr");
    const before = rows().length;
    await user.click(screen.getByRole("button", { name: /add line item/i }));
    expect(rows().length).toBe(before + 1);
  });

  it("updates the total when quantity changes", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <InvoiceForm
          mode="create"
          defaultValues={DEFAULT_VALUES}
          onSubmit={vi.fn()}
          isSubmitting={false}
        />
      </Wrapper>,
    );
    expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
    const qtyInput = screen.getAllByPlaceholderText("0")[0];
    await user.clear(qtyInput);
    await user.type(qtyInput, "3");
    await waitFor(() => expect(screen.getAllByText("$300.00").length).toBeGreaterThan(0));
  });
});
