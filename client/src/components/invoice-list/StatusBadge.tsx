import { Badge } from "@mantine/core";
import type { InvoiceStatus } from "~shared/types";

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  Draft: "gray",
  Sent: "blue",
  Paid: "green",
  Void: "red",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge color={STATUS_COLOR[status]} variant={status === "Void" ? "light" : "filled"} size="sm">
      {status}
    </Badge>
  );
}
