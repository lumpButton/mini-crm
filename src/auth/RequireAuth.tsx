import { Alert, Button, Center, Loader, Stack } from "@mantine/core";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

export function RequireAuth() {
  const { session, profile, profileError, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return (
      <Center h="100vh">
        <Stack maw={420}>
          <Alert color="red" title="Нет доступа">
            {profileError}
          </Alert>
          <Button variant="default" onClick={signOut}>
            Выйти
          </Button>
        </Stack>
      </Center>
    );
  }

  return <Outlet />;
}
