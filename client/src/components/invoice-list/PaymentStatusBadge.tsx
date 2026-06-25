import { Badge } from "@mantine/core";
import type { PaymentStatus } from "~shared/types";

const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  Unsent: "gray",
  Open: "blue",
  Partial: "violet",
  Overdue: "orange",
  Paid: "green",
  Voided: "gray",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      color={PAYMENT_COLOR[status]}
      variant={status === "Voided" ? "light" : "filled"}
      size="sm"
    >
      {status}
    </Badge>
  );
}
