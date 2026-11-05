import { Anchor, Table, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { useProfile } from "../auth/authContext";
import { PageState } from "../components/PageState";
import { StatusBadge } from "../components/StatusBadge";
import { supabase } from "../lib/supabaseClient";
import { formatDate } from "../lib/types";
import { useLoader } from "../lib/useLoader";

async function loadMyTasks(profileId: string) {
  // RLS already limits an executor to their own tasks; the filter keeps the intent explicit.
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, created_at, object:objects(id, name)")
    .eq("assignee_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function MyTasksPage() {
  const profile = useProfile();
  const tasks = useLoader(() => loadMyTasks(profile.id), [profile.id]);

  return (
    <>
      <Title order={2} mb="md">
        Мои задачи
      </Title>

      <PageState loading={tasks.loading} error={tasks.error} />

      {tasks.data && tasks.data.length === 0 && <Text c="dimmed">Вам пока не назначено ни одной задачи.</Text>}

      {tasks.data && tasks.data.length > 0 && (
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Задача</Table.Th>
                <Table.Th>Объект</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Создана</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.data.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/tasks/${task.id}`}>
                      {task.title}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/objects/${task.object.id}`}>
                      {task.object.name}
                    </Anchor>
                  </Table.Td>
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
    </>
  );
}
