import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FAB, Text } from "react-native-paper";

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
import { useAuth } from "../../../contexts/AuthContext";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { OccurrenceStackParamList } from "../../../routes/OccurrenceStackRoutes";
import { listOccurrences } from "../../../services/occurrences/occurrenceServices";
import { Occurrence, OccurrenceStatus } from "../../../types/Occurrence";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

const sorts: readonly SortDefinition<Occurrence>[] = [
  {
    key: "recent",
    label: "Mais recentes",
    compare: (a, b) => getMillis(b.createdAt) - getMillis(a.createdAt),
  },
  {
    key: "oldest",
    label: "Mais antigas",
    compare: (a, b) => getMillis(a.createdAt) - getMillis(b.createdAt),
  },
  {
    key: "resource",
    label: "Recurso de A a Z",
    compare: (a, b) => a.recurso.nome.localeCompare(b.recurso.nome),
  },
];

function getMillis(timestamp: Occurrence["createdAt"]) {
  if (!timestamp) return 0;
  return timestamp.toDate
    ? timestamp.toDate().getTime()
    : timestamp.seconds * 1000;
}

function formatDate(timestamp: Occurrence["createdAt"]) {
  const millis = getMillis(timestamp);
  return millis
    ? new Date(millis).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Data não informada";
}

function getStatusLabel(status: OccurrenceStatus) {
  return {
    ABERTA: "Aberta",
    EM_ANALISE: "Em análise",
    ENCERRADA: "Encerrada",
  }[status];
}

function searchOccurrence(item: Occurrence, search: string) {
  return [
    item.recurso.nome,
    item.descricao,
    item.autor.nome,
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function OccurrenceListScreen() {
  const { appUser } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<OccurrenceStackParamList>>();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({});
  const [activeSort, setActiveSort] = useState("recent");

  const load = useCallback(async () => {
    if (!appUser) return;
    const data = await listOccurrences(appUser);
    setOccurrences(data);
    setError(null);
  }, [appUser]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        try {
          setLoading(true);
          if (!appUser) return;
          const data = await listOccurrences(appUser);
          if (active) {
            setOccurrences(data);
            setError(null);
          }
        } catch (loadError) {
          console.log("Erro ao carregar ocorrências:", loadError);
          if (active) {
            setError("Não foi possível carregar as ocorrências.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void run();
      return () => {
        active = false;
      };
    }, [appUser])
  );

  const filters = useMemo<readonly FilterDefinition<Occurrence>[]>(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Aberta", value: "ABERTA" },
          { label: "Em análise", value: "EM_ANALISE" },
          { label: "Encerrada", value: "ENCERRADA" },
        ],
        predicate: (item, value) => item.status === value,
      },
      {
        key: "tipo",
        label: "Tipo de recurso",
        type: "select",
        options: [
          { label: "Ferramenta", value: "FERRAMENTA" },
          { label: "Máquina", value: "MAQUINA" },
          { label: "Laboratório", value: "LABORATORIO" },
        ],
        predicate: (item, value) => item.recurso.tipo === value,
      },
      {
        key: "autor",
        label: "Autor",
        type: "text",
        predicate: (item, value) =>
          normalizeFilterText(item.autor.nome).includes(
            normalizeFilterText(value)
          ),
      },
      {
        key: "data",
        label: "Data de abertura",
        type: "date",
        predicate: (item, value) => {
          const millis = getMillis(item.createdAt);
          if (!millis) return false;
          return new Date(millis).toLocaleDateString("pt-BR") === value;
        },
      },
    ],
    []
  );

  const filtered = useListFilter({
    data: occurrences,
    search,
    filters,
    activeFilters,
    sorts,
    activeSort,
    searchPredicate: searchOccurrence,
  });
  const { refreshing, refresh } = useManualRefresh({
    onRefresh: load,
    errorMessage: "Não foi possível atualizar as ocorrências.",
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
    return <Loading message="Carregando ocorrências..." />;
  }

  return (
    <ScreenContainer>
      {!!error && <AppAlert variant="error" message={error} />}

      <AppListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por recurso, descrição ou autor"
        filters={filters}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={sorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {filtered.length === 0 ? (
        <ScrollView
          style={styles.empty}
          contentContainerStyle={styles.emptyContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="alert-triangle"
              title="Nenhuma ocorrência encontrada"
              message={
                occurrences.length
                  ? "Tente alterar a busca ou os filtros."
                  : "As ocorrências registradas aparecerão aqui."
              }
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("OccurrenceDetails", {
                  occurrenceId: item.id,
                })
              }
            >
              <AppCard style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.recurso.nome}</Text>
                    <Text style={styles.subtitle}>
                      {item.recurso.tipo === "FERRAMENTA"
                        ? "Ferramenta"
                        : item.recurso.tipo === "MAQUINA"
                          ? "Máquina"
                          : "Laboratório"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      item.status === "EM_ANALISE" && styles.warningBadge,
                      item.status === "ENCERRADA" && styles.closedBadge,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.description} numberOfLines={2}>
                  {item.descricao}
                </Text>
                <View style={styles.details}>
                  <Text style={styles.detailText}>
                    Autor: {item.autor.nome}
                  </Text>
                  <Text style={styles.detailText}>
                    Aberta em: {formatDate(item.createdAt)}
                  </Text>
                </View>
                <View style={styles.openRow}>
                  <Text style={styles.openText}>Ver detalhes</Text>
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

      <FAB
        icon="plus"
        color={colors.white}
        style={styles.fab}
        onPress={() => navigation.navigate("CreateOccurrence")}
      />
    </ScreenContainer>
  );
}
