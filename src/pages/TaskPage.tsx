import { useState } from "react";
import {
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Timeline,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../auth/authContext";
import { PageState } from "../components/PageState";
import { StatusBadge } from "../components/StatusBadge";
import { TaskFormModal } from "../components/TaskFormModal";
import { notifyError, notifySuccess } from "../lib/errors";
import { supabase } from "../lib/supabaseClient";
import { STATUS_LABELS, formatDate } from "../lib/types";
import { useLoader } from "../lib/useLoader";
import { availableActions, type StatusAction } from "../lib/workflow";

async function loadTask(id: string) {
  const [task, history] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        `id, title, description, status, created_at, object_id, assignee_id,
         object:objects(id, name),
         assignee:profiles!tasks_assignee_id_fkey(display_name),
         author:profiles!tasks_author_id_fkey(display_name)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("task_status_history")
      .select("id, old_status, new_status, comment, changed_at, changed_by:profiles(display_name)")
      .eq("task_id", id)
      .order("changed_at")
      .order("id"),
  ]);
  if (task.error) throw task.error;
  if (history.error) throw history.error;
  return { task: task.data, history: history.data };
}

export function TaskPage() {
  const { id = "" } = useParams();
  const profile = useProfile();
  const isManager = profile.role === "manager";
  const navigate = useNavigate();
  const page = useLoader(() => loadTask(id), [id]);
  const [editOpened, edit] = useDisclosure(false);
  const [commentAction, setCommentAction] = useState<StatusAction | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!page.data) {
    return <PageState loading={page.loading} error={page.error} />;
  }

  const { task, history } = page.data;

  if (!task) {
    return <Alert color="yellow">Задача не найдена или у вас нет к ней доступа.</Alert>;
  }

  const actions = availableActions(task, profile);

  async function changeStatus(action: StatusAction, actionComment?: string) {
    if (!task) return;
    setBusy(true);
    const { error } = await supabase.rpc("change_task_status", {
      p_task_id: task.id,
      p_new_status: action.to,
      p_comment: actionComment,
    });
    setBusy(false);
    if (error) {
      notifyError(error);
      return;
    }
    notifySuccess(`Статус: ${STATUS_LABELS[action.to]}`);
    setCommentAction(null);
    setComment("");
    page.reload();
  }

  function handleAction(action: StatusAction) {
    if (action.requiresComment) {
      setCommentAction(action);
    } else {
      void changeStatus(action);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm(`Удалить задачу «${task.title}» вместе с историей?`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      notifyError(error);
      return;
    }
    notifySuccess("Задача удалена");
    navigate(`/objects/${task.object_id}`);
  }

  return (
    <Stack>
      <Anchor component={Link} to={`/objects/${task.object.id}`} size="sm">
        ← {task.object.name}
      </Anchor>

      <Paper withBorder p="md">
        <Stack>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Title order={2}>{task.title}</Title>
              <StatusBadge status={task.status} />
            </Group>
            {isManager && (
              <Group>
                <Button variant="default" onClick={edit.open}>
                  Редактировать
                </Button>
                <Button color="red" variant="light" onClick={handleDelete}>
                  Удалить
                </Button>
              </Group>
            )}
          </Group>

          <Text style={{ whiteSpace: "pre-wrap" }}>{task.description || "Без описания"}</Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Text size="sm">
              <Text span c="dimmed">Объект: </Text>
              <Anchor component={Link} to={`/objects/${task.object.id}`}>
                {task.object.name}
              </Anchor>
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Исполнитель: </Text>
              {task.assignee.display_name}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Автор: </Text>
              {task.author.display_name}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Создана: </Text>
              {formatDate(task.created_at)}
            </Text>
          </SimpleGrid>

          {actions.length > 0 && (
            <Group>
              {actions.map((action) => (
                <Button key={action.to} color={action.color} loading={busy} onClick={() => handleAction(action)}>
                  {action.label}
                </Button>
              ))}
            </Group>
          )}
        </Stack>
      </Paper>

      <Title order={3}>История</Title>
      <Timeline bulletSize={14} lineWidth={2}>
        {history.map((entry) => (
          <Timeline.Item
            key={entry.id}
            title={
              entry.old_status
                ? `${STATUS_LABELS[entry.old_status]} → ${STATUS_LABELS[entry.new_status]}`
                : `Создана: ${STATUS_LABELS[entry.new_status]}`
            }
          >
            <Text size="sm" c="dimmed">
              {entry.changed_by.display_name} · {formatDate(entry.changed_at)}
            </Text>
            {entry.comment && (
              <Text size="sm" mt={4} style={{ whiteSpace: "pre-wrap" }}>
                {entry.comment}
              </Text>
            )}
          </Timeline.Item>
        ))}
      </Timeline>

      <Modal
        opened={commentAction !== null}
        onClose={() => setCommentAction(null)}
        title={commentAction?.label}
      >
        <Stack>
          <Textarea
            label="Комментарий"
            description="Что нужно исправить"
            required
            autosize
            minRows={3}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCommentAction(null)}>
              Отмена
            </Button>
            <Button
              color={commentAction?.color}
              loading={busy}
              disabled={comment.trim() === ""}
              onClick={() => commentAction && changeStatus(commentAction, comment.trim())}
            >
              Отправить
            </Button>
          </Group>
        </Stack>
      </Modal>

      {isManager && (
        <TaskFormModal
          opened={editOpened}
          onClose={edit.close}
          onSaved={page.reload}
          initial={{
            id: task.id,
            title: task.title,
            description: task.description,
            object_id: task.object_id,
            assignee_id: task.assignee_id,
          }}
        />
      )}
    </Stack>
  );
}
