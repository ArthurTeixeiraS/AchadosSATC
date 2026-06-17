import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { AppAlert } from "../../../components/AppAlert";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";

import {
  isSolicitationOverdue,
  listSolicitations,
} from "../../../services/solicitations/solicitationServices";
import { Solicitation } from "../../../types/Solicitation";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { usePersistentScreenState } from "../../../hooks/usePersistentScreenState";
import { FuncionarioSolicitacaoStackParamList } from "../../../routes/FuncionarioSolicitacaoStackRoutes";

type Props = NativeStackScreenProps<
  FuncionarioSolicitacaoStackParamList,
  "ReceivedSolicitations"
>;

type SolicitationGroup = {
  date: string;
  items: Solicitation[];
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    ALTERACAO_PENDENTE: "Alteração pendente",
    RECUSADA: "Recusada",
    EM_USO: "Em uso",
    ENCERRADA: "Encerrada",
    CANCELADA: "Cancelada",
  };

  return labels[status] ?? status;
}

function getTurnoLabel(turno: string) {
  const labels: Record<string, string> = {
    TARDE: "Tarde",
    NOITE: "Noite",
  };

  return labels[turno] ?? turno;
}

function getSolicitationCode(id: string) {
  return `SL-${id.slice(0, 4).toUpperCase()}`;
}

function getItemsCount(item: Solicitation) {
  const machinesCount = item.maquinas?.length ?? 0;
  const toolsCount =
    item.ferramentas?.reduce(
      (total: number, tool: any) => total + Number(tool.quantidade ?? 0),
      0
    ) ?? 0;

  return machinesCount + toolsCount;
}

function getPendingChangeItemsCount(item: Solicitation) {
  const analysis = item.analiseAlteracao;

  if (!analysis) {
    return 0;
  }

  return [...analysis.maquinas, ...analysis.ferramentas].filter(
    (changeItem) => changeItem.status === "PENDENTE"
  ).length;
}

function isOverdue(item: Solicitation, now: Date) {
  return isSolicitationOverdue(item, now);
}

function getCreatedAtSeconds(item: Solicitation) {
  return item.createdAt?.seconds ?? 0;
}

function parseBrazilianDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function isFromToday(value: string) {
  const useDate = parseBrazilianDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Number.isFinite(useDate) && useDate >= today.getTime();
}

const solicitationFilters: readonly FilterDefinition<Solicitation>[] = [
  {
    key: "fromToday",
    label: "A partir de hoje",
    type: "boolean",
    placeholder: "Ocultar solicitações com data de uso anterior a hoje.",
    predicate: (item, value) =>
      value !== "true" || isFromToday(item.dataUtilizacao),
    formatValue: () => "Ativo",
  },
  {
    key: "analysisPending",
    label: "Aguardando análise",
    type: "boolean",
    placeholder:
      "Mostrar solicitações pendentes e alterações aguardando reaprovação.",
    predicate: (item, value) =>
      value !== "true" ||
      item.status === "PENDENTE" ||
      item.status === "ALTERACAO_PENDENTE",
    formatValue: () => "Ativo",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Pendente", value: "PENDENTE" },
      { label: "Aprovada", value: "APROVADA" },
      { label: "Alteração pendente", value: "ALTERACAO_PENDENTE" },
      { label: "Recusada", value: "RECUSADA" },
      { label: "Em uso", value: "EM_USO" },
      { label: "Encerrada", value: "ENCERRADA" },
      { label: "Cancelada", value: "CANCELADA" },
    ],
    predicate: (item, value) => item.status === value,
  },
  {
    key: "prioridade",
    label: "Prioridade",
    type: "select",
    options: [
      { label: "Normal", value: "NORMAL" },
      { label: "Imediata", value: "IMEDIATA" },
    ],
    predicate: (item, value) => item.prioridade === value,
  },
  {
    key: "dataUtilizacao",
    label: "Data de uso",
    type: "date",
    predicate: (item, value) => item.dataUtilizacao === value,
  },
  {
    key: "turno",
    label: "Turno",
    type: "select",
    options: [
      { label: "Tarde", value: "TARDE" },
      { label: "Noite", value: "NOITE" },
    ],
    predicate: (item, value) => item.turno === value,
  },
];

const solicitationSorts: readonly SortDefinition<Solicitation>[] = [
  {
    key: "use-date-asc",
    label: "Data de uso mais próxima",
    compare: (a, b) =>
      parseBrazilianDate(a.dataUtilizacao) -
      parseBrazilianDate(b.dataUtilizacao),
  },
  {
    key: "use-date-desc",
    label: "Data de uso mais distante",
    compare: (a, b) =>
      parseBrazilianDate(b.dataUtilizacao) -
      parseBrazilianDate(a.dataUtilizacao),
  },
  {
    key: "created-desc",
    label: "Criadas recentemente",
    compare: (a, b) => getCreatedAtSeconds(b) - getCreatedAtSeconds(a),
  },
  {
    key: "created-asc",
    label: "Criadas há mais tempo",
    compare: (a, b) => getCreatedAtSeconds(a) - getCreatedAtSeconds(b),
  },
  {
    key: "professor-asc",
    label: "Professor de A a Z",
    compare: (a, b) => a.professorNome.localeCompare(b.professorNome),
  },
  {
    key: "professor-desc",
    label: "Professor de Z a A",
    compare: (a, b) => b.professorNome.localeCompare(a.professorNome),
  },
];

function searchSolicitation(item: Solicitation, search: string) {
  return [
    item.professorNome,
    item.professorCracha,
    item.id,
    getSolicitationCode(item.id),
  ].some((value) => normalizeFilterText(value).includes(search));
}

const defaultReceivedFilters: ActiveListFilters = {
  fromToday: "true",
};

export function SolicitacoesRecebidasScreen({ route, navigation }: Props) {
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = usePersistentScreenState(
    "receivedSolicitations.search",
    ""
  );
  const [activeFilters, setActiveFilters] =
    usePersistentScreenState<ActiveListFilters>(
      "receivedSolicitations.filters",
      defaultReceivedFilters
    );
  const [activeSort, setActiveSort] = usePersistentScreenState(
    "receivedSolicitations.sort",
    ""
  );
  const [expandedDates, setExpandedDates] = usePersistentScreenState<string[]>(
    "receivedSolicitations.expandedDates",
    []
  );
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const initialStatus = route.params?.initialStatus;
    const initialAnalysisPending = route.params?.initialAnalysisPending;
    const initialFromToday = route.params?.initialFromToday;
    const clearFilters = route.params?.clearFilters;
    const resetFiltersToken = route.params?.resetFiltersToken;

    if (
      !initialStatus &&
      !initialAnalysisPending &&
      initialFromToday === undefined &&
      !clearFilters &&
      !resetFiltersToken
    ) {
      return;
    }

    setSearch("");
    setActiveSort("");
    setExpandedDates([]);
    setActiveFilters(
      initialStatus || initialAnalysisPending || initialFromToday !== undefined
        ? {
            ...(initialStatus ? { status: initialStatus } : {}),
            ...(initialAnalysisPending ? { analysisPending: "true" } : {}),
            ...(initialFromToday ? { fromToday: "true" } : {}),
          }
        : defaultReceivedFilters
    );
    navigation.setParams({
      initialStatus: undefined,
      initialAnalysisPending: undefined,
      initialFromToday: undefined,
      clearFilters: undefined,
      resetFiltersToken: undefined,
    });
  }, [
    route.params?.initialStatus,
    route.params?.initialAnalysisPending,
    route.params?.initialFromToday,
    route.params?.clearFilters,
    route.params?.resetFiltersToken,
    navigation,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  async function fetchSolicitations() {
    const data = await listSolicitations();
    setSolicitations(data);
  }

  async function loadSolicitations() {
    try {
      setLoading(true);
      await fetchSolicitations();
    } catch (error) {
      console.log("Erro ao buscar solicitações recebidas:", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSolicitations();
    }, [])
  );

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: fetchSolicitations,
    errorMessage:
      "Não foi possível atualizar as solicitações recebidas. Tente novamente.",
  });

  function toggleDate(date: string) {
    setExpandedDates((current) => {
      if (current.includes(date)) {
        return current.filter((item) => item !== date);
      }

      return [...current, date];
    });
  }

  const overdueSolicitations = useMemo(() => {
    const onlyFromToday = activeFilters.fromToday === "true";

    return solicitations.filter(
      (item) =>
        isOverdue(item, currentTime) &&
        (!onlyFromToday || isFromToday(item.dataUtilizacao))
    );
  }, [solicitations, currentTime, activeFilters.fromToday]);

  const availableSolicitations = useMemo(
    () => solicitations.filter((item) => !isOverdue(item, currentTime)),
    [solicitations, currentTime]
  );

  const filteredSolicitations = useListFilter({
    data: availableSolicitations,
    search,
    filters: solicitationFilters,
    activeFilters,
    sorts: solicitationSorts,
    activeSort,
    searchPredicate: searchSolicitation,
  });

  const groupedSolicitations = useMemo<SolicitationGroup[]>(() => {
    const groups: Record<string, Solicitation[]> = {};

    filteredSolicitations.forEach((item) => {
      const date = item.dataUtilizacao || "Sem data";

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(item);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items,
      }))
      .sort((a, b) => parseBrazilianDate(a.date) - parseBrazilianDate(b.date));
  }, [filteredSolicitations]);

  function renderSolicitationCard(item: Solicitation) {
    const isChangePending = item.status === "ALTERACAO_PENDENTE";
    const pendingChangeItemsCount = getPendingChangeItemsCount(item);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("FuncionarioSolicitationDetails", {
            solicitationId: item.id,
          })
        }
      >
        <AppCard style={styles.solicitationCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardMainInfo}>
              <Text style={styles.solicitationCode}>
                {getSolicitationCode(item.id)}
              </Text>

              <Text style={styles.professorName}>
                {item.professorNome ?? "Professor não informado"}
              </Text>

              <Text style={styles.dateText}>
                {item.dataUtilizacao} • {getTurnoLabel(item.turno)}
              </Text>
            </View>

            <View style={styles.badgeContainer}>
              {item.prioridade === "IMEDIATA" && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>Imediata</Text>
                </View>
              )}

              <View
                style={[
                  styles.statusBadge,
                  isChangePending && styles.changePendingStatusBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isChangePending && styles.changePendingStatusBadgeText,
                  ]}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.itemSummary,
              isChangePending && styles.changePendingItemSummary,
            ]}
          >
            <Text style={styles.itemSummaryText}>
              {isChangePending
                ? `${pendingChangeItemsCount} acréscimo${
                    pendingChangeItemsCount !== 1 ? "s" : ""
                  } aguardando reaprovação`
                : `${getItemsCount(item)} item${
                    getItemsCount(item) !== 1 ? "s" : ""
                  }`}
            </Text>

            <View
              style={[
                styles.detailsRow,
                isChangePending && styles.changePendingDetailsRow,
              ]}
            >
              <Text style={styles.detailsText}>
                {isChangePending ? "Revisar alteração" : "Ver detalhes"}
              </Text>
              <Feather
                name={isChangePending ? "edit-3" : "chevron-right"}
                size={16}
                color={colors.primary}
              />
            </View>
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return <Loading message="Carregando solicitações..." />;
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
        searchPlaceholder="Buscar por professor, crachá ou código"
        filters={solicitationFilters}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={solicitationSorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {overdueSolicitations.length > 0 && (
        <View style={styles.overdueSection}>
          <AppAlert
            variant="error"
            title="Solicitações em atraso:"
            message={`${overdueSolicitations.length} solicitação(ões) possuem itens ainda não devolvidos.`}
          />

          {overdueSolicitations.map((item) => (
            <View key={item.id}>{renderSolicitationCard(item)}</View>
          ))}
        </View>
      )}

      {groupedSolicitations.length === 0 ? (
        <ScrollView
          alwaysBounceVertical
          style={styles.emptyList}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="file-text"
              title="Nenhuma solicitação encontrada"
              message={
                solicitations.length === 0
                  ? "As solicitações dos professores aparecerão aqui."
                  : "Tente alterar a busca ou os filtros aplicados."
              }
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedSolicitations}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={refreshControl}
          renderItem={({ item }) => {
            const isExpanded = expandedDates.includes(item.date);

            return (
              <AppCard style={styles.groupCard}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleDate(item.date)}
                >
                  <View>
                    <Text style={styles.groupDate}>{item.date}</Text>

                    <Text style={styles.groupCount}>
                      {item.items.length} {item.items.length !== 1 ? "solicitações" : "solicitação"}
                    </Text>
                  </View>

                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.groupItems}>
                    {item.items.map((solicitation) => (
                      <View key={solicitation.id}>
                        {renderSolicitationCard(solicitation)}
                      </View>
                    ))}
                  </View>
                )}
              </AppCard>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
