import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
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
import {
  getMachinesAvailabilityForPeriod,
  getToolsAvailabilityForPeriod,
  MachinePeriodAvailability,
  ToolPeriodAvailability,
} from "../../../services/solicitations/solicitationServices";
import { Resource } from "../../../types/Resources";
import { SolicitationShift } from "../../../types/Solicitation";

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

// Componente separado pra cada botao de menu, assim o useRef funciona certo
function ResourceMenuButton({ item, navigation }: {
  item: Resource;
  navigation: NativeStackNavigationProp<ResourceStackParamList>;
}) {
  const buttonRef =
    useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  function handleOpenMenu() {
    buttonRef.current?.measureInWindow((_x, y, _width, height) => {
      const menuHeight = 98;
      const spacing = 4;
      const topBelow = y + height + spacing;
      const top = topBelow + menuHeight <= windowHeight
        ? topBelow
        : Math.max(8, y - menuHeight - spacing);

      setMenuTop(top);
      setMenuOpen(true);
    });
  }

  return (
    <View>
      <TouchableOpacity ref={buttonRef} onPress={handleOpenMenu}>
        <View style={styles.editButton}>
          <Feather name="more-vertical" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {menuOpen && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setMenuOpen(false)}
          />
          <View style={[styles.menuBox, { top: menuTop }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("EditResource", { resource: item });
              }}
            >
              <Feather name="edit-2" size={14} color={colors.text} />
              <Text style={styles.menuItemText}>Editar</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("CreateResource", { duplicateFrom: item });
              }}
            >
              <Feather name="copy" size={14} color={colors.text} />
              <Text style={styles.menuItemText}>Copiar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

export function ResourceScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({});
  const [activeSort, setActiveSort] = useState("name-asc");
  const [periodAvailabilityLoading, setPeriodAvailabilityLoading] =
    useState(false);
  const [periodAvailabilityError, setPeriodAvailabilityError] =
    useState(false);
  const [toolAvailabilityById, setToolAvailabilityById] = useState<
    Record<string, ToolPeriodAvailability>
  >({});
  const [machineAvailabilityById, setMachineAvailabilityById] = useState<
    Record<string, MachinePeriodAvailability>
  >({});
  const navigation = useNavigation<NativeStackNavigationProp<ResourceStackParamList>>();
  const insets = useSafeAreaInsets();
  const periodDate = activeFilters.dataUtilizacao;
  const periodShift = activeFilters.turno as SolicitationShift | undefined;
  const hasPeriod = !!periodDate && !!periodShift;
  const hasIncompletePeriod =
    (!!periodDate && !periodShift) || (!periodDate && !!periodShift);

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

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPeriodAvailability() {
        if (!periodDate || !periodShift) {
          setToolAvailabilityById({});
          setMachineAvailabilityById({});
          setPeriodAvailabilityError(false);
          setPeriodAvailabilityLoading(false);
          return;
        }

        try {
          setPeriodAvailabilityLoading(true);
          setPeriodAvailabilityError(false);

          const tools = resources.filter(
            (resource) => resource.tipo === "FERRAMENTA"
          );
          const machines = resources.filter(
            (resource) => resource.tipo === "MAQUINA"
          );

          const [toolAvailability, machineAvailability] =
            await Promise.all([
              getToolsAvailabilityForPeriod(
                tools,
                periodDate,
                periodShift
              ),
              getMachinesAvailabilityForPeriod(
                machines,
                periodDate,
                periodShift
              ),
            ]);

          if (!active) {
            return;
          }

          setToolAvailabilityById(toolAvailability);
          setMachineAvailabilityById(machineAvailability);
        } catch (error) {
          console.log(
            "Erro ao calcular disponibilidade dos recursos:",
            error
          );

          if (active) {
            setPeriodAvailabilityError(true);
            setToolAvailabilityById({});
            setMachineAvailabilityById({});
          }
        } finally {
          if (active) {
            setPeriodAvailabilityLoading(false);
          }
        }
      }

      loadPeriodAvailability();

      return () => {
        active = false;
      };
    }, [periodDate, periodShift, resources])
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
      {
        key: "dataUtilizacao",
        label: "Data de uso",
        type: "date",
        predicate: () => true,
      },
      {
        key: "turno",
        label: "Turno",
        type: "select",
        options: [
          { label: "Tarde", value: "TARDE" },
          { label: "Noite", value: "NOITE" },
        ],
        predicate: () => true,
      },
      {
        key: "disponivelPeriodo",
        label: "Disponivel no periodo",
        type: "boolean",
        placeholder: "Requer data de uso e turno.",
        formatValue: () => "Ativo",
        predicate: (item) => {
          if (
            !hasPeriod ||
            periodAvailabilityLoading ||
            periodAvailabilityError
          ) {
            return true;
          }

          if (item.status === "MANUTENCAO") {
            return false;
          }

          if (item.tipo === "FERRAMENTA") {
            return (
              (toolAvailabilityById[item.id]?.availableQuantity ?? 0) > 0
            );
          }

          if (item.tipo === "MAQUINA") {
            return machineAvailabilityById[item.id]?.available ?? false;
          }

          return item.status === "DISPONIVEL";
        },
      },
    ];
  }, [
    hasPeriod,
    machineAvailabilityById,
    periodAvailabilityError,
    periodAvailabilityLoading,
    resources,
    toolAvailabilityById,
  ]);

  const visibleResources = useMemo(() => {
    if (activeFilters.status === "ARQUIVADO") {
      return resources;
    }
    return resources.filter((r) => r.isArchived !== true);
  }, [resources, activeFilters.status]);

  const filteredResources = useListFilter({
    data: visibleResources,
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

  function getPeriodAvailabilityLabel(item: Resource) {
    if (!hasPeriod) {
      return null;
    }

    if (periodAvailabilityLoading) {
      return "Calculando disponibilidade no periodo...";
    }

    if (periodAvailabilityError) {
      return "Nao foi possivel calcular a disponibilidade no periodo.";
    }

    if (item.status === "MANUTENCAO") {
      return "Indisponivel no periodo";
    }

    if (item.tipo === "FERRAMENTA") {
      const availability = toolAvailabilityById[item.id];
      const totalQuantity =
        availability?.totalQuantity ?? item.quantidadeTotal ?? 0;
      const availableQuantity = availability?.availableQuantity ?? 0;

      return `Disponivel no periodo: ${availableQuantity} de ${totalQuantity}`;
    }

    if (item.tipo === "MAQUINA") {
      return machineAvailabilityById[item.id]?.available
        ? "Disponivel no periodo"
        : "Indisponivel no periodo";
    }

    return item.status === "DISPONIVEL"
      ? "Disponivel operacionalmente"
      : "Indisponivel operacionalmente";
  }

  function isPeriodAvailabilityUnavailable(item: Resource) {
    if (!hasPeriod || periodAvailabilityLoading || periodAvailabilityError) {
      return false;
    }

    if (item.status === "MANUTENCAO") {
      return true;
    }

    if (item.tipo === "FERRAMENTA") {
      return (toolAvailabilityById[item.id]?.availableQuantity ?? 0) <= 0;
    }

    if (item.tipo === "MAQUINA") {
      return !(machineAvailabilityById[item.id]?.available ?? false);
    }

    return item.status !== "DISPONIVEL";
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
        extraHeaderAction={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Recursos arquivados"
            style={{
              height: 48,
              width: 48,
              borderRadius: 8,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("ArchivedResourcesList")}
          >
            <Feather name="archive" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {hasIncompletePeriod && (
        <Text style={styles.periodHint}>
          Informe data de uso e turno para consultar a disponibilidade no
          periodo.
        </Text>
      )}

      {visibleResources.length === 0 ? (
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
            <AppCard style={item.isArchived ? { opacity: 0.6 } : undefined}>
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
                      <Text style={styles.resourceName}>
                        {item.nome}
                        {item.isArchived ? " (ARQUIVADO)" : ""}
                      </Text>
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
                    <Text style={styles.resourceType}>{getTypeLabel(item.tipo)}</Text>
                    <ResourceMenuButton item={item} navigation={navigation} />
                  </View>
                </View>

                {item.descricao && (
                  <Text style={styles.resourceDescription}>{item.descricao}</Text>
                )}

                <Text style={styles.resourceStatus}>Status: {getStatusLabel(item.status)}</Text>

                {getPeriodAvailabilityLabel(item) && (
                  <Text
                    style={[
                      styles.periodAvailability,
                      isPeriodAvailabilityUnavailable(item) &&
                        styles.periodAvailabilityUnavailable,
                    ]}
                  >
                    {getPeriodAvailabilityLabel(item)}
                  </Text>
                )}
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
