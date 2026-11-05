import { Alert, Center, Loader } from "@mantine/core";
import { errorMessage } from "../lib/errors";

// Shared loading / error placeholder for pages. Returns null when the page can render its data.
export function PageState({ loading, error }: { loading: boolean; error: unknown }) {
  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }
  if (error) {
    return (
      <Alert color="red" title="Не удалось загрузить данные">
        {errorMessage(error)}
      </Alert>
    );
  }
  return null;
}
