import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { AppAlert } from "../../../components/AppAlert";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { usePersistentScreenState } from "../../../hooks/usePersistentScreenState";
import { listKeyMovements } from "../../../services/keys/keyServices";
import { KeyMovement } from "../../../types/Key";
import { colors } from "../../../styles/colors";
import { styles } from "../KeyDetailsScreen/styles";
import { styles as listStyles } from "../KeyListScreen/styles";

const movementFilters: readonly FilterDefinition<KeyMovement>[] = [
  {
    key: "status",
    label: "Situação",
    type: "select",
    options: [
      { label: "Em aberto", value: "EM_ABERTO" },
      { label: "Devolvida", value: "DEVOLVIDA" },
    ],
    predicate: (item, value) => item.status === value,
  },
  {
    key: "professor",
    label: "Professor",
    type: "text",
    predicate: (item, value) =>
      normalizeFilterText(item.professor.nome).includes(
        normalizeFilterText(value)
      ),
  },
  {
    key: "responsavel",
    label: "Funcionário",
    type: "text",
    predicate: (item, value) => {
      const normalized = normalizeFilterText(value);
      return [
        item.retiradaPor.nome,
        item.devolvidaPor?.nome,
      ].some((name) => normalizeFilterText(name).includes(normalized));
    },
  },
  {
    key: "dataInicial",
    label: "Data inicial",
    type: "date",
    predicate: (item, value) => {
      const start = parseFilterDate(value);
      const itemDate = getMillis(item.retiradaEm);
      return Boolean(itemDate && start && itemDate >= start);
    },
  },
  {
    key: "dataFinal",
    label: "Data final",
    type: "date",
    predicate: (item, value) => {
      const end = parseFilterDate(value, true);
      const itemDate = getMillis(item.retiradaEm);
      return Boolean(itemDate && end && itemDate <= end);
    },
  },
];

const movementSorts: readonly SortDefinition<KeyMovement>[] = [
  {
    key: "recent",
    label: "Retiradas recentes",
    compare: (a, b) => getMillis(b.retiradaEm) - getMillis(a.retiradaEm),
  },
  {
    key: "oldest",
    label: "Retiradas antigas",
    compare: (a, b) => getMillis(a.retiradaEm) - getMillis(b.retiradaEm),
  },
  {
    key: "key",
    label: "Chave de A a Z",
    compare: (a, b) => a.chaveCodigo.localeCompare(b.chaveCodigo),
  },
];

function getMillis(timestamp?: KeyMovement["retiradaEm"]) {
  if (!timestamp) return 0;
  if (timestamp.toDate) return timestamp.toDate().getTime();
  return timestamp.seconds ? timestamp.seconds * 1000 : 0;
}

function formatDate(timestamp?: KeyMovement["retiradaEm"]) {
  const millis = getMillis(timestamp);
  return millis
    ? new Date(millis).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Data não informada";
}

function parseFilterDate(value: string, endOfDay = false) {
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (!Number.isFinite(date.getTime())) return 0;

  date.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return date.getTime();
}

function searchMovement(item: KeyMovement, search: string) {
  return [
    item.chaveCodigo,
    item.chaveLocalizacao,
    item.professor.nome,
    item.professor.cracha,
    item.retiradaPor.nome,
    item.devolvidaPor?.nome,
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function KeyMovementHistoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const keyId = route.params?.keyId;
  const [movements, setMovements] = useState<KeyMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = usePersistentScreenState(
    "keyMovements.search",
    ""
  );
  const [activeFilters, setActiveFilters] =
    usePersistentScreenState<ActiveListFilters>("keyMovements.filters", {});
  const [activeSort, setActiveSort] = usePersistentScreenState(
    "keyMovements.sort",
    "recent"
  );

  useEffect(() => {
    if (!route.params?.resetFiltersToken) return;

    setSearch("");
    setActiveFilters({});
    setActiveSort("recent");
    navigation.setParams({ resetFiltersToken: undefined });
  }, [navigation, route.params?.resetFiltersToken]);

  const fetchMovements = useCallback(async () => {
    const data = await listKeyMovements(keyId);
    setMovements(data);
    setError(null);
  }, [keyId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          const data = await listKeyMovements(keyId);
          if (active) {
            setMovements(data);
            setError(null);
          }
        } catch (loadError) {
          console.log("Erro ao carregar movimentações de chaves:", loadError);
          if (active) {
            setError("Não foi possível carregar o histórico de chaves.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [keyId])
  );

  const filteredMovements = useListFilter({
    data: movements,
    search,
    filters: movementFilters,
    activeFilters,
    sorts: movementSorts,
    activeSort,
    searchPredicate: searchMovement,
  });
  const { refreshing, refresh } = useManualRefresh({
    onRefresh: fetchMovements,
    errorMessage: "Não foi possível atualizar o histórico de chaves.",
  });
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  if (loading) {
    return <Loading message="Carregando histórico..." />;
  }

  return (
    <ScreenContainer>
      {!!error && <AppAlert variant="error" message={error} />}

      <AppListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por chave, professor ou responsável"
        filters={movementFilters}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={movementSorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {filteredMovements.length === 0 ? (
        <ScrollView
          style={listStyles.emptyList}
          contentContainerStyle={listStyles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="clock"
              title="Nenhuma movimentação encontrada"
              message={
                movements.length
                  ? "Tente alterar a busca ou os filtros."
                  : "As retiradas e devoluções aparecerão aqui."
              }
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredMovements}
          keyExtractor={(item) => item.id}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("KeyDetails", {
                  keyId: item.chaveId,
                  origin: "HISTORY",
                  originKeyId: keyId,
                })
              }
            >
              <AppCard style={styles.movementHistoryCard}>
                <View style={styles.movementHeader}>
                  <Text style={styles.movementTitle}>
                    {item.chaveCodigo}
                  </Text>
                  <View
                    style={[
                      styles.movementStatusBadge,
                      item.status === "EM_ABERTO" &&
                        styles.openMovementStatusBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.movementStatus,
                        item.status === "EM_ABERTO" && styles.borrowedStatus,
                      ]}
                    >
                      {item.status === "EM_ABERTO" ? "Em aberto" : "Devolvida"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.movementSubtitle}>
                  Professor: {item.professor.nome}
                  {item.professor.cracha ? ` · ${item.professor.cracha}` : ""}
                </Text>
                <Text style={styles.movementMeta}>
                  Retirada por {item.retiradaPor.nome} em{" "}
                  {formatDate(item.retiradaEm)}
                </Text>
                {item.devolvidaPor && (
                  <Text style={styles.movementMeta}>
                    Devolvida por {item.devolvidaPor.nome} em{" "}
                    {formatDate(item.devolvidaEm)}
                  </Text>
                )}
                <View style={styles.movementHeader}>
                  <Text style={styles.movementSubtitle}>
                    {item.chaveLocalizacao}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={colors.primary}
                  />
                </View>
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}
