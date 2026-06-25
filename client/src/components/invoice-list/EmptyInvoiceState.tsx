import { Button, Center, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export function EmptyInvoiceState() {
  return (
    <Center py={80}>
      <Stack align="center" gap="md">
        <Text fz={48} lh={1} aria-hidden>
          🧾
        </Text>
        <Text fw={600} fz="lg">
          No invoices yet
        </Text>
        <Text c="dimmed" fz="sm" ta="center" maw={300}>
          Create your first invoice to start tracking payments and activity.
        </Text>
        <Button component={Link} to="/invoices/new">
          Create invoice
        </Button>
      </Stack>
    </Center>
  );
}
