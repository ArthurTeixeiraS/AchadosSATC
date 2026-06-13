import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

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
import { FAB } from "react-native-paper";
import { colors } from "../../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { useManualRefresh } from "../../../hooks/useManualRefresh";

// Seria interessante exibir os laboratórios aos quais as máquinas estão associadas

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
  {
    key: "status-asc",
    label: "Status",
    compare: (a, b) => a.status.localeCompare(b.status),
  },
  {
    key: "quantity-asc",
    label: "Menor quantidade disponível",
    compare: (a, b) =>
      (a.quantidadeDisponivel ?? 0) - (b.quantidadeDisponivel ?? 0),
  },
  {
    key: "quantity-desc",
    label: "Maior quantidade disponível",
    compare: (a, b) =>
      (b.quantidadeDisponivel ?? 0) - (a.quantidadeDisponivel ?? 0),
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

export function ResourceScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({});
  const [activeSort, setActiveSort] = useState("name-asc");
  const navigation = useNavigation<NativeStackNavigationProp<ResourceStackParamList>>();
  const insets = useSafeAreaInsets();

  async function fetchResources() {
    const data = await listResources();
    setResources(data);
  }

  async function loadResources() {
    try {
      setLoading(true);
      await fetchResources();
    } catch (error) {
      console.log("Erro ao buscar recursos:", error);
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

  const resourceFilters = useMemo<
    readonly FilterDefinition<Resource>[]
  >(() => {
    const laboratories = resources
      .filter((resource) => resource.tipo === "LABORATORIO")
      .sort((a, b) => a.nome.localeCompare(b.nome));

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
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Disponível", value: "DISPONIVEL" },
          { label: "Em uso", value: "EM_USO" },
          { label: "Manutenção", value: "MANUTENCAO" },
        ],
        predicate: (item, value) => item.status === value,
      },
      {
        key: "laboratorio",
        label: "Laboratório relacionado",
        type: "select",
        options: laboratories.map((laboratory) => ({
          label: laboratory.nome,
          value: laboratory.id,
        })),
        predicate: (item, value) =>
          item.id === value || item.laboratorioId === value,
      },
      {
        key: "quantidadeDisponivel",
        label: "Quantidade disponível",
        type: "number",
        placeholder: "Informe a quantidade exata",
        predicate: (item, value) =>
          (item.quantidadeDisponivel ?? 0) === Number(value),
      },
    ];
  }, [resources]);

  const filteredResources = useListFilter({
    data: resources,
    search,
    filters: resourceFilters,
    activeFilters,
    sorts: resourceSorts,
    activeSort,
    searchPredicate: searchResource,
  });

  if (loading) {
    return <Loading message="Carregando recursos..." />;
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      DISPONIVEL: "Disponível",
      EM_USO: "Em uso",
      MANUTENCAO: "Manutenção",
    };

    return labels[status] ?? status;
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      FERRAMENTA: "Ferramenta",
      MAQUINA: "Máquina",
      LABORATORIO: "Laboratório",
    };

    return labels[type] ?? type;
  }

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  return (
    <ScreenContainer>
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

      {resources.length === 0 ? (
        <ScrollView
          alwaysBounceVertical
          style={styles.emptyList}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="briefcase"
              title="Nenhum recurso cadastrado"
              message="Cadastre ferramentas, máquinas ou laboratórios para começar."
            />
          </AppCard>
        </ScrollView>
      ) : filteredResources.length === 0 ? (
        <ScrollView
          alwaysBounceVertical
          style={styles.emptyList}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="briefcase"
              title="Nenhum recurso encontrado"
              message="Tente alterar a busca ou os filtros aplicados."
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 88 + insets.bottom },
          ]}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <AppCard>
              <View style={styles.cardContent}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceNameContainer}>

                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ResourceDetails", {
                          resource: item,
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

                  <Text style={styles.resourceType}>{getTypeLabel(item.tipo)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.resourceActions}
                  onPress={() =>
                    navigation.navigate("EditResource", {
                      resource: item,
                    })
                  }
                >
                  <View style={styles.editButton}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                {item.descricao && (
                  <Text style={styles.resourceDescription}>{item.descricao}</Text>
                )}

                <Text style={styles.resourceStatus}>Status: {getStatusLabel(item.status)}</Text>
              </View>
            </AppCard>
          )}
        />
      )}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        color={colors.white}
        onPress={() =>
          navigation.navigate("CreateResource", undefined)
        }
      />
    </ScreenContainer>
  );
}
