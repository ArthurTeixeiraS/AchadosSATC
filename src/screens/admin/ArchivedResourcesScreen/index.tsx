import React, { useCallback, useState, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import Feather from "@expo/vector-icons/Feather";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";

import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";

import { styles } from "./styles";
import { colors } from "../../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { useManualRefresh } from "../../../hooks/useManualRefresh";

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
  const navigation = useNavigation<NativeStackNavigationProp<ResourceStackParamList>>();
  const insets = useSafeAreaInsets();

  async function fetchResources() {
    const data = await listResources({ includeArchived: true });
    setResources(data.filter((r) => r.isArchived === true));
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

  if (loading && !refreshing) {
    return <Loading message="Carregando arquivo..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenContainer edges={["left", "right"]} style={styles.screenContent}>
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
          leftHeaderAction={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={{
                height: 54,
                width: 54,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => navigation.navigate("ResourceList")}
            >
              <Feather name="arrow-left" size={20} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        {filteredResources.length === 0 ? (
          <EmptyState
            icon="archive"
            title={
              search.trim()
                ? "Nenhum recurso encontrado"
                : "Arquivo vazio"
            }
            message={
              search.trim()
                ? "Tente buscar com outros termos."
                : "Nenhum recurso foi arquivado ainda."
            }
          />
        ) : (
          <FlatList
            data={filteredResources}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("ResourceDetails", {
                    resource: item,
                    origin: "ARCHIVED",
                  })
                }
              >
                <AppCard style={styles.resourceCard}>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName} numberOfLines={2}>
                      {item.nome}
                    </Text>
                    {item.descricao ? (
                      <Text
                        style={styles.resourceDescription}
                        numberOfLines={1}
                      >
                        {item.descricao}
                      </Text>
                    ) : null}

                    <View style={styles.resourceBadges}>
                      <View style={styles.resourceTypeBadge}>
                        <Text style={styles.resourceTypeBadgeText}>
                          {item.tipo.toLowerCase()}
                        </Text>
                      </View>
                      <View style={[styles.resourceStatusBadge, styles.resourceStatusArchived]}>
                        <Text style={styles.resourceStatusArchivedText}>
                          arquivado
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </AppCard>
              </TouchableOpacity>
            )}
          />
        )}
      </ScreenContainer>
    </View>
  );
}
