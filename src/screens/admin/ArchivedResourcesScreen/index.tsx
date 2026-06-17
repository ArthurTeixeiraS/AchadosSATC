import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Feather from "@expo/vector-icons/Feather";

import { AppCard } from "../../../components/AppCard";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { listResources } from "../../../services/resources/resourceServices";
import { colors } from "../../../styles/colors";
import { Resource } from "../../../types/Resources";

import { styles } from "./styles";

const resourceSorts: readonly SortDefinition<Resource>[] = [
  {
    key: "name-asc",
    label: "Nome de A a Z",
    compare: (a, b) => a.nome.localeCompare(b.nome),
  },
  {
    key: "name-desc",
    label: "Nome de Z a A",
    compare: (a, b) => b.nome.localeCompare(a.nome),
  },
  {
    key: "type-asc",
    label: "Tipo de recurso",
    compare: (a, b) => a.tipo.localeCompare(b.tipo),
  },
];

function searchResource(item: Resource, search: string) {
  return [
    item.nome,
    item.descricao,
    item.patrimonio,
    item.localizacao,
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function ArchivedResourcesScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveListFilters>({});
  const [activeSort, setActiveSort] = useState("name-asc");
  const navigation =
    useNavigation<NativeStackNavigationProp<ResourceStackParamList>>();

  async function fetchResources() {
    const data = await listResources({ includeArchived: true });
    setResources(data.filter((resource) => resource.isArchived === true));
  }

  async function loadResources() {
    try {
      setLoading(true);
      await fetchResources();
    } catch (error) {
      console.log("Erro ao buscar recursos arquivados:", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: fetchResources,
    errorMessage: "Não foi possível atualizar os recursos. Tente novamente.",
  });

  const resourceFilters = useMemo<readonly FilterDefinition<Resource>[]>(() => {
    return [
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { label: "Ferramenta", value: "FERRAMENTA" },
          { label: "Máquina", value: "MAQUINA" },
          { label: "Laboratório", value: "LABORATORIO" },
        ],
        predicate: (item, value) => item.tipo === value,
      },
    ];
  }, []);

  const filteredResources = useListFilter({
    data: resources,
    search,
    searchPredicate: searchResource,
    activeFilters,
    filters: resourceFilters,
    activeSort,
    sorts: resourceSorts,
  });
  const hasActiveQuery =
    search.trim().length > 0 || Object.keys(activeFilters).length > 0;

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  if (loading && !refreshing) {
    return <Loading message="Carregando recursos arquivados..." />;
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      FERRAMENTA: "Ferramenta",
      MAQUINA: "Máquina",
      LABORATORIO: "Laboratório",
    };

    return labels[type] ?? type;
  }

  return (
    <View style={styles.container}>
      <ScreenContainer style={styles.screenContent}>
        <AppListFilter
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome, patrimônio ou localização"
          filters={resourceFilters}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          sorts={resourceSorts}
          activeSort={activeSort}
          onSortChange={setActiveSort}
        />

        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredResources.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <AppCard style={styles.emptyCard}>
              <EmptyState
                icon="archive"
                title={
                  hasActiveQuery
                    ? "Nenhum recurso encontrado"
                    : "Arquivo vazio"
                }
                message={
                  hasActiveQuery
                    ? "Tente alterar a busca ou os filtros aplicados."
                    : "Nenhum recurso foi arquivado ainda."
                }
              />
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard>
              <View style={styles.cardContent}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceNameContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ResourceDetails", {
                          resource: item,
                          origin: "ARCHIVED",
                        })
                      }
                    >
                      <Text style={styles.resourceName}>{item.nome}</Text>
                    </TouchableOpacity>
                    {!!item.imagemUrl && (
                      <Feather
                        name="image"
                        size={16}
                        color={colors.primary}
                        style={styles.imageIcon}
                      />
                    )}
                  </View>

                  <View style={styles.resourceActions}>
                    <Text style={styles.resourceType}>
                      {getTypeLabel(item.tipo)}
                    </Text>
                  </View>
                </View>

                {item.descricao && (
                  <Text style={styles.resourceDescription}>
                    {item.descricao}
                  </Text>
                )}

                <Text style={styles.resourceStatus}>
                  Status:{" "}
                  <Text style={styles.archivedStatus}>Arquivado</Text>
                </Text>
              </View>
            </AppCard>
          )}
        />
      </ScreenContainer>
    </View>
  );
}
