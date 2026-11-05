import { useCallback, useEffect, useState, type DependencyList } from "react";

type LoaderState<T> = {
  data: T | undefined;
  error: unknown;
  loading: boolean;
};

// Runs an async loader when deps change and exposes reload() for refetching after mutations.
export function useLoader<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<LoaderState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false });
      },
      (error: unknown) => {
        if (!cancelled) setState({ data: undefined, error, loading: false });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
