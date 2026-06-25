import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
import { ConfirmModal } from "../../components/common/ConfirmModal";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function renderModal(props: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <Wrapper>
      <ConfirmModal
        opened={true}
        title="Delete item"
        message="Are you sure you want to delete this item?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />
    </Wrapper>,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmModal", () => {
  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderModal();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not call onConfirm when cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows custom confirmLabel", () => {
    renderModal({ confirmLabel: "Void invoice" });
    expect(screen.getByRole("button", { name: /void invoice/i })).toBeInTheDocument();
  });

  it("shows loading state on confirm button when isLoading", () => {
    renderModal({ isLoading: true });
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();
  });
});
