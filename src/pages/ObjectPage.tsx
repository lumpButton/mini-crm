import { Alert, Anchor, Button, Group, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../auth/authContext";
import { ObjectFormModal } from "../components/ObjectFormModal";
import { PageState } from "../components/PageState";
import { StatusBadge } from "../components/StatusBadge";
import { TaskFormModal } from "../components/TaskFormModal";
import { notifyError, notifySuccess } from "../lib/errors";
import { supabase } from "../lib/supabaseClient";
import { formatDate } from "../lib/types";
import { useLoader } from "../lib/useLoader";

async function loadObject(id: string) {
  const [object, tasks] = await Promise.all([
    supabase.from("objects").select("id, name, address").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, created_at, assignee:profiles!tasks_assignee_id_fkey(display_name)")
      .eq("object_id", id)
      .order("created_at"),
  ]);
  if (object.error) throw object.error;
  if (tasks.error) throw tasks.error;
  return { object: object.data, tasks: tasks.data };
}

export function ObjectPage() {
  const { id = "" } = useParams();
  const profile = useProfile();
  const isManager = profile.role === "manager";
  const navigate = useNavigate();
  const page = useLoader(() => loadObject(id), [id]);
  const [objectFormOpened, objectForm] = useDisclosure(false);
  const [taskFormOpened, taskForm] = useDisclosure(false);

  if (!page.data) {
    return <PageState loading={page.loading} error={page.error} />;
  }

  const { object, tasks } = page.data;

  if (!object) {
    return <Alert color="yellow">Объект не найден или у вас нет к нему доступа.</Alert>;
  }

  async function handleDelete() {
    if (!object) return;
    if (!window.confirm(`Удалить объект «${object.name}» вместе со всеми задачами и их историей?`)) return;
    const { error } = await supabase.from("objects").delete().eq("id", object.id);
    if (error) {
      notifyError(error);
      return;
    }
    notifySuccess("Объект удалён");
    navigate("/");
  }

  return (
    <Stack>
      <Anchor component={Link} to="/" size="sm">
        ← Все объекты
      </Anchor>

      <Paper withBorder p="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{object.name}</Title>
            <Text c="dimmed">{object.address}</Text>
          </div>
          {isManager && (
            <Group>
              <Button variant="default" onClick={objectForm.open}>
                Редактировать
              </Button>
              <Button color="red" variant="light" onClick={handleDelete}>
                Удалить
              </Button>
            </Group>
          )}
        </Group>
      </Paper>

      <Group justify="space-between">
        <Title order={3}>{isManager ? "Задачи" : "Мои задачи на объекте"}</Title>
        {isManager && <Button onClick={taskForm.open}>Новая задача</Button>}
      </Group>

      {tasks.length === 0 ? (
        <Text c="dimmed">Задач нет.</Text>
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Задача</Table.Th>
                <Table.Th>Исполнитель</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Создана</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/tasks/${task.id}`}>
                      {task.title}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{task.assignee.display_name}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={task.status} />
                  </Table.Td>
                  <Table.Td>{formatDate(task.created_at)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {isManager && (
        <>
          <ObjectFormModal
            opened={objectFormOpened}
            onClose={objectForm.close}
            onSaved={page.reload}
            initial={object}
          />
          <TaskFormModal
            opened={taskFormOpened}
            onClose={taskForm.close}
            onSaved={(taskId) => navigate(`/tasks/${taskId}`)}
            defaultObjectId={object.id}
          />
        </>
      )}
    </Stack>
  );
}
