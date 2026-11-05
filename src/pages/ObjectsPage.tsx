import { Anchor, Button, Group, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import { useProfile } from "../auth/authContext";
import { ObjectFormModal } from "../components/ObjectFormModal";
import { PageState } from "../components/PageState";
import { supabase } from "../lib/supabaseClient";
import { useLoader } from "../lib/useLoader";

async function loadObjects() {
  // tasks(count) goes through RLS too: an executor sees how many of *their* tasks the object has.
  const { data, error } = await supabase
    .from("objects")
    .select("id, name, address, tasks(count)")
    .order("name");
  if (error) throw error;
  return data;
}

export function ObjectsPage() {
  const profile = useProfile();
  const isManager = profile.role === "manager";
  const objects = useLoader(loadObjects, []);
  const [formOpened, form] = useDisclosure(false);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Объекты</Title>
        {isManager && <Button onClick={form.open}>Новый объект</Button>}
      </Group>

      <PageState loading={objects.loading} error={objects.error} />

      {objects.data && objects.data.length === 0 && (
        <Text c="dimmed">{isManager ? "Объектов пока нет." : "У вас нет задач ни на одном объекте."}</Text>
      )}

      {objects.data && objects.data.length > 0 && (
        <Table.ScrollContainer minWidth={500}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Адрес</Table.Th>
                <Table.Th>{isManager ? "Задач" : "Моих задач"}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {objects.data.map((object) => (
                <Table.Tr key={object.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/objects/${object.id}`}>
                      {object.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{object.address}</Table.Td>
                  <Table.Td>{object.tasks[0]?.count ?? 0}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {isManager && <ObjectFormModal opened={formOpened} onClose={form.close} onSaved={objects.reload} />}
    </>
  );
}
