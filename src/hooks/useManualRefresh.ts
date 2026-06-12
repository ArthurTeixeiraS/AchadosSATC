import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

type UseManualRefreshParams = {
  onRefresh: () => Promise<void>;
  errorTitle?: string;
  errorMessage?: string;
};

export function useManualRefresh({
  onRefresh,
  errorTitle = "Erro ao atualizar",
  errorMessage = "Não foi possível atualizar os dados. Tente novamente.",
}: UseManualRefreshParams) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      await onRefreshRef.current();
    } catch (error) {
      console.log("Erro na atualização manual:", error);
      Alert.alert(errorTitle, errorMessage);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [errorMessage, errorTitle]);

  return {
    refreshing,
    refresh,
  };
}
