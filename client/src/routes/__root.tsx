import { AppShell, Button, Group, Text } from "@mantine/core";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text
            component={Link}
            to="/invoices"
            fw={700}
            fz="lg"
            style={{ textDecoration: "none", color: "inherit", letterSpacing: "-0.02em" }}
          >
            Rillet
          </Text>
          <Button component={Link} to="/invoices/new" size="sm">
            New Invoice
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
