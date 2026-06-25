import { Stack, Text, Tooltip } from "@mantine/core";
import type { ActivityEvent } from "~shared/types";
import { SYSTEM_ACTOR } from "~shared/constants";
import { formatDate, formatRelativeDate } from "../../lib/formatters";

interface ActivityLogProps {
  activity: ActivityEvent[];
}

export function ActivityLog({ activity }: ActivityLogProps) {
  const sorted = [...activity].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <Stack gap="xs">
      <Text fz="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>
        Activity
      </Text>
      {sorted.map((event) => (
        <Stack key={event.id} gap={2}>
          <Text fz="sm">{event.action}</Text>
          <Text fz="xs" c={event.actor === SYSTEM_ACTOR ? "dimmed" : undefined}>
            {event.actor === SYSTEM_ACTOR ? "🤖 " : ""}
            {event.actor}
            {" · "}
            <Tooltip label={formatDate(event.timestamp)} position="top" withArrow>
              <Text span style={{ borderBottom: "1px dotted", cursor: "default" }}>
                {formatRelativeDate(event.timestamp)}
              </Text>
            </Tooltip>
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
