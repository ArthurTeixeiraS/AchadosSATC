import { useCallback, useState } from "react";

const screenStateStore = new Map<string, unknown>();

export function usePersistentScreenState<T>(key: string, initialState: T) {
  const [state, setState] = useState<T>(() => {
    if (screenStateStore.has(key)) {
      return screenStateStore.get(key) as T;
    }

    screenStateStore.set(key, initialState);
    return initialState;
  });

  const setPersistentState = useCallback(
    (nextState: T | ((currentState: T) => T)) => {
      setState((currentState) => {
        const value =
          typeof nextState === "function"
            ? (nextState as (currentState: T) => T)(currentState)
            : nextState;

        screenStateStore.set(key, value);
        return value;
      });
    },
    [key]
  );

  return [state, setPersistentState] as const;
}
