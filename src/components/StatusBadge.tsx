import { Badge } from "@mantine/core";
import { STATUS_COLORS, STATUS_LABELS, type TaskStatus } from "../lib/types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge color={STATUS_COLORS[status]} variant="light">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
