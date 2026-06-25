import { Box, Tooltip } from "@mantine/core";
import type { ReactNode } from "react";

interface NeedsReviewHighlightProps {
  flagged: boolean;
  children: ReactNode;
}

export function NeedsReviewHighlight({ flagged, children }: NeedsReviewHighlightProps) {
  if (!flagged) return <>{children}</>;
  return (
    <Tooltip label="Flagged for review by Invoice Assistant" position="top-start" withArrow>
      <Box
        style={{
          borderLeft: "3px solid var(--mantine-color-yellow-5)",
          paddingLeft: "var(--mantine-spacing-xs)",
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}
