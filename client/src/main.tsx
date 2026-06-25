import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/queryClient";

const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "sm",
  fontFamily: "Inter, system-ui, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, ui-monospace, monospace",
  colors: {
    slate: [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#475569",
      "#334155",
      "#1e293b",
      "#0f172a",
    ],
  },
  other: {
    financialFontFeatures: "tnum",
  },
});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);
