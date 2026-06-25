import { Group } from "@mantine/core";
import type { Invoice } from "~shared/types";

interface ActionButtonsProps {
  invoice: Invoice;
}

// Wired in Phase 12
export function ActionButtons({ invoice: _invoice }: ActionButtonsProps) {
  return <Group />;
}
