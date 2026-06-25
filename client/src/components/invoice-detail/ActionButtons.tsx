import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { STATUS_TRANSITIONS } from "~shared/constants";
import type { Invoice } from "~shared/types";
import { useTransitionInvoice } from "../../hooks/useTransitionInvoice";

interface ActionButtonsProps {
  invoice: Invoice;
}

export function ActionButtons({ invoice }: ActionButtonsProps) {
  const { mutate: transition, isPending } = useTransitionInvoice(invoice.id);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Mirror server logic: Overdue maps to Sent for transition key
  const transitionKey =
    invoice.paymentStatus === "Overdue" ? "Sent" : invoice.status;
  const actions = STATUS_TRANSITIONS[transitionKey] ?? [];

  if (actions.length === 0) return <Group />;

  function handleTransition(action: string) {
    transition(
      { action },
      {
        onSuccess: () => {
          notifications.show({ message: actionLabel(action), color: "green" });
        },
        onError: (err) => {
          notifications.show({ message: err.message, color: "red", title: "Action failed" });
        },
      },
    );
  }

  function handleRecordPayment() {
    transition(
      { action: "recordPayment", paidDate },
      {
        onSuccess: () => {
          notifications.show({ message: "Payment recorded", color: "green" });
          setPaymentModalOpen(false);
        },
        onError: (err) => {
          notifications.show({ message: err.message, color: "red", title: "Action failed" });
        },
      },
    );
  }

  return (
    <>
      <Modal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record payment"
        centered
      >
        <Stack>
          <Text fz="sm" c="dimmed">
            Confirm the date payment was received for {invoice.invoiceNumber}.
          </Text>
          <TextInput
            label="Payment date"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPaymentModalOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} loading={isPending} disabled={!paidDate}>
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group gap="xs">
        {actions.includes("send") && (
          <Button size="sm" variant="default" loading={isPending} onClick={() => handleTransition("send")}>
            Mark as Sent
          </Button>
        )}
        {(actions.includes("recordPayment") || actions.includes("recordPartialPayment")) && (
          <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
            Record Payment
          </Button>
        )}
      </Group>
    </>
  );
}

function actionLabel(action: string): string {
  switch (action) {
    case "send": return "Invoice marked as sent";
    case "recordPayment": return "Payment recorded";
    default: return "Done";
  }
}
