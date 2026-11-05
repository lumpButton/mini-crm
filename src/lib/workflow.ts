import type { Profile, TaskStatus } from "./types";

export type StatusAction = {
  to: TaskStatus;
  label: string;
  color: string;
  requiresComment: boolean;
};

// Mirrors public.change_task_status: the UI only shows what the database will accept.
// The database stays the source of truth and rejects anything else.
export function availableActions(
  task: { status: TaskStatus; assignee_id: string },
  profile: Profile,
): StatusAction[] {
  const isAssignee = profile.role === "executor" && task.assignee_id === profile.id;
  const isManager = profile.role === "manager";

  switch (task.status) {
    case "new":
      return isAssignee
        ? [{ to: "in_progress", label: "Взять в работу", color: "blue", requiresComment: false }]
        : [];
    case "in_progress":
      return isAssignee
        ? [{ to: "in_review", label: "Отправить на проверку", color: "yellow", requiresComment: false }]
        : [];
    case "rework":
      return isAssignee
        ? [{ to: "in_progress", label: "Вернуть в работу", color: "blue", requiresComment: false }]
        : [];
    case "in_review":
      return isManager
        ? [
            { to: "accepted", label: "Принять", color: "green", requiresComment: false },
            { to: "rework", label: "Вернуть на доработку", color: "red", requiresComment: true },
          ]
        : [];
    case "accepted":
      return [];
  }
}
