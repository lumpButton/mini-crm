import { notifications } from "@mantine/notifications";

const MESSAGES_BY_CODE: Record<string, string> = {
  "42501": "Недостаточно прав для этого действия",
  P0002: "Задача не найдена или недоступна",
  "22023": "Действие недоступно в текущем статусе задачи",
  "23514": "Данные не прошли проверку",
  "23503": "Связанная запись не найдена",
};

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code === "23514" && "message" in error) {
      const message = String((error as { message: unknown }).message);
      if (message.includes("assignee must be an executor")) {
        return "Исполнителем можно назначить только пользователя с ролью «Исполнитель»";
      }
    }
    if (code === "22023" && "message" in error) {
      const message = String((error as { message: unknown }).message);
      if (message.includes("comment is required")) {
        return "Для возврата на доработку нужен комментарий";
      }
    }
    if (MESSAGES_BY_CODE[code]) {
      return MESSAGES_BY_CODE[code];
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Неизвестная ошибка";
}

export function notifyError(error: unknown) {
  notifications.show({ color: "red", title: "Ошибка", message: errorMessage(error) });
}

export function notifySuccess(message: string) {
  notifications.show({ color: "green", message });
}
