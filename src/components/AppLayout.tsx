import { Anchor, AppShell, Button, Container, Group, Text } from "@mantine/core";
import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { useAuth, useProfile } from "../auth/authContext";
import { ROLE_LABELS } from "../lib/types";

export function AppLayout() {
  const profile = useProfile();
  const { signOut } = useAuth();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="lg" wrap="nowrap">
              <Text fw={700}>Мини-CRM</Text>
              <Anchor component={RouterNavLink} to="/" end>
                Объекты
              </Anchor>
              {profile.role === "executor" && (
                <Anchor component={RouterNavLink} to="/my-tasks">
                  Мои задачи
                </Anchor>
              )}
            </Group>
            <Group gap="sm" wrap="nowrap">
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {profile.display_name} · {ROLE_LABELS[profile.role]}
              </Text>
              <Button variant="subtle" size="xs" onClick={signOut}>
                Выйти
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
