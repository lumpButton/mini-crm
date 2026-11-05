import type { Database } from "./database.types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  in_review: "На проверке",
  accepted: "Принята",
  rework: "На доработке",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  new: "gray",
  in_progress: "blue",
  in_review: "yellow",
  accepted: "green",
  rework: "red",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  manager: "Постановщик",
  executor: "Исполнитель",
};

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
