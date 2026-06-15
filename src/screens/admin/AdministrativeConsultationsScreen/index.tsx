import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import {
  buildResourceAllocations,
  buildSolicitationHistory,
  getSolicitationCode,
  getTimestampMillis,
  loadAdministrativeConsultationData,
  parseBrazilianDate,
} from "../../../services/solicitations/administrativeConsultationServices";
import {
  ResourceAllocation,
  SolicitationHistoryEntry,
} from "../../../types/AdministrativeConsultation";
import { Solicitation } from "../../../types/Solicitation";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

type ConsultationTab = "ALLOCATIONS" | "HISTORY";

const allocationSorts: readonly SortDefinition<ResourceAllocation>[] = [
  {
    key: "priority",
    label: "Atrasados e data mais próxima",
    compare: (a, b) =>
      Number(b.atrasado) - Number(a.atrasado) ||
      parseBrazilianDate(a.dataUtilizacao) -
        parseBrazilianDate(b.dataUtilizacao) ||
      a.recursoNome.localeCompare(b.recursoNome),
  },
  {
    key: "date-asc",
    label: "Data de uso mais próxima",
    compare: (a, b) =>
      parseBrazilianDate(a.dataUtilizacao) -
      parseBrazilianDate(b.dataUtilizacao),
  },
  {
    key: "date-desc",
    label: "Data de uso mais distante",
    compare: (a, b) =>
      parseBrazilianDate(b.dataUtilizacao) -
      parseBrazilianDate(a.dataUtilizacao),
  },
  {
    key: "resource-asc",
    label: "Recurso de A a Z",
    compare: (a, b) => a.recursoNome.localeCompare(b.recursoNome),
  },
  {
    key: "professor-asc",
    label: "Professor de A a Z",
    compare: (a, b) => a.professorNome.localeCompare(b.professorNome),
  },
];

const historySorts: readonly SortDefinition<SolicitationHistoryEntry>[] = [
  {
    key: "terminal-desc",
    label: "Finalizadas recentemente",
    compare: (a, b) =>
      getTimestampMillis(b.terminalAt) - getTimestampMillis(a.terminalAt),
  },
  {
    key: "terminal-asc",
    label: "Finalizadas há mais tempo",
    compare: (a, b) =>
      getTimestampMillis(a.terminalAt) - getTimestampMillis(b.terminalAt),
  },
  {
    key: "use-date-desc",
    label: "Data de uso mais recente",
    compare: (a, b) =>
      parseBrazilianDate(b.solicitation.dataUtilizacao) -
      parseBrazilianDate(a.solicitation.dataUtilizacao),
  },
  {
    key: "professor-asc",
    label: "Professor de A a Z",
    compare: (a, b) =>
      a.solicitation.professorNome.localeCompare(
        b.solicitation.professorNome
      ),
  },
];

function getStatusLabel(status: Solicitation["status"]) {
  const labels: Partial<Record<Solicitation["status"], string>> = {
    ENCERRADA: "Encerrada",
    RECUSADA: "Recusada",
    CANCELADA: "Cancelada",
  };

  return labels[status] ?? status;
}

function getShiftLabel(shift: Solicitation["turno"]) {
  return shift === "TARDE" ? "Tarde" : "Noite";
}

function formatTimestamp(entry: SolicitationHistoryEntry) {
  const timestamp = entry.terminalAt;
  if (!timestamp) return "Data não informada";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp.seconds * 1000);

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getSolicitationResourceNames(solicitation: Solicitation) {
  return [
    ...solicitation.maquinas.map((machine) => machine.nome),
    ...solicitation.ferramentas.map((tool) => tool.nome),
  ];
}

function searchAllocation(item: ResourceAllocation, search: string) {
  return [
    item.recursoNome,
    item.professorNome,
    item.solicitacaoId,
    getSolicitationCode(item.solicitacaoId),
  ].some((value) => normalizeFilterText(value).includes(search));
}

function searchHistory(item: SolicitationHistoryEntry, search: string) {
  const solicitation = item.solicitation;

  return [
    solicitation.professorNome,
    solicitation.id,
    getSolicitationCode(solicitation.id),
    ...getSolicitationResourceNames(solicitation),
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function AdministrativeConsultationsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] =
    useState<ConsultationTab>("ALLOCATIONS");
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [history, setHistory] = useState<SolicitationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [allocationSearch, setAllocationSearch] = useState("");
  const [allocationFilters, setAllocationFilters] =
    useState<ActiveListFilters>({});
  const [allocationSort, setAllocationSort] = useState("priority");

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilters, setHistoryFilters] =
    useState<ActiveListFilters>({});
  const [historySort, setHistorySort] = useState("terminal-desc");

  const loadBaseData = useCallback(async () => {
    const data = await loadAdministrativeConsultationData();
    setSolicitations(data);
    setError(null);
    return data;
  }, []);

  const loadHistory = useCallback(
    async (source = solicitations) => {
      setHistoryLoading(true);

      try {
        const entries = await buildSolicitationHistory(source);
        setHistory(entries);
        setError(null);
      } catch (historyError) {
        console.log("Erro ao carregar histórico:", historyError);
        setError("Não foi possível carregar o histórico de solicitações.");
      } finally {
        setHistoryLoaded(true);
        setHistoryLoading(false);
      }
    },
    [solicitations]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          const data = await loadAdministrativeConsultationData();

          if (!active) return;

          setSolicitations(data);
          setHistoryLoaded(false);
          setError(null);
        } catch (loadError) {
          console.log("Erro ao carregar consultas administrativas:", loadError);
          if (active) {
            setError("Não foi possível carregar as consultas administrativas.");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const allocations = useMemo(
    () => buildResourceAllocations(solicitations, currentTime),
    [currentTime, solicitations]
  );

  useEffect(() => {
    if (
      activeTab === "HISTORY" &&
      !historyLoaded &&
      !historyLoading &&
      !loading
    ) {
      void loadHistory();
    }
  }, [
    activeTab,
    historyLoaded,
    historyLoading,
    loadHistory,
    loading,
  ]);

  const allocationFilterDefinitions = useMemo<
    readonly FilterDefinition<ResourceAllocation>[]
  >(
    () => [
      {
        key: "situacao",
        label: "Situação",
        type: "select",
        options: [
          { label: "Reservado", value: "RESERVADO" },
          { label: "Retirado", value: "RETIRADO" },
        ],
        predicate: (item, value) => item.situacao === value,
      },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { label: "Máquina", value: "MAQUINA" },
          { label: "Ferramenta", value: "FERRAMENTA" },
        ],
        predicate: (item, value) => item.recursoTipo === value,
      },
      {
        key: "professor",
        label: "Professor",
        type: "text",
        predicate: (item, value) =>
          normalizeFilterText(item.professorNome).includes(
            normalizeFilterText(value)
          ),
      },
      {
        key: "recurso",
        label: "Recurso",
        type: "text",
        predicate: (item, value) =>
          normalizeFilterText(item.recursoNome).includes(
            normalizeFilterText(value)
          ),
      },
      {
        key: "data",
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
      {
        key: "atrasado",
        label: "Somente atrasados",
        type: "boolean",
        predicate: (item, value) => value !== "true" || item.atrasado,
        formatValue: () => "Ativo",
      },
    ],
    []
  );

  const historyFilterDefinitions = useMemo<
    readonly FilterDefinition<SolicitationHistoryEntry>[]
  >(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Encerrada", value: "ENCERRADA" },
          { label: "Recusada", value: "RECUSADA" },
          { label: "Cancelada", value: "CANCELADA" },
        ],
        predicate: (item, value) => item.solicitation.status === value,
      },
      {
        key: "professor",
        label: "Professor",
        type: "text",
        predicate: (item, value) =>
          normalizeFilterText(item.solicitation.professorNome).includes(
            normalizeFilterText(value)
          ),
      },
      {
        key: "recurso",
        label: "Recurso",
        type: "text",
        predicate: (item, value) =>
          getSolicitationResourceNames(item.solicitation).some((name) =>
            normalizeFilterText(name).includes(normalizeFilterText(value))
          ),
      },
      {
        key: "data",
        label: "Data de uso",
        type: "date",
        predicate: (item, value) =>
          item.solicitation.dataUtilizacao === value,
      },
      {
        key: "responsavel",
        label: "Responsável",
        type: "text",
        predicate: (item, value) =>
          item.responsibleNames.some((name) =>
            normalizeFilterText(name).includes(normalizeFilterText(value))
          ),
      },
    ],
    []
  );

  const filteredAllocations = useListFilter({
    data: allocations,
    search: allocationSearch,
    filters: allocationFilterDefinitions,
    activeFilters: allocationFilters,
    sorts: allocationSorts,
    activeSort: allocationSort,
    searchPredicate: searchAllocation,
  });

  const filteredHistory = useListFilter({
    data: history,
    search: historySearch,
    filters: historyFilterDefinitions,
    activeFilters: historyFilters,
    sorts: historySorts,
    activeSort: historySort,
    searchPredicate: searchHistory,
  });

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: async () => {
      const updatedSolicitations = await loadBaseData();

      if (activeTab === "HISTORY") {
        await loadHistory(updatedSolicitations);
      } else if (historyLoaded) {
        setHistoryLoaded(false);
      }
    },
    errorMessage: "Não foi possível atualizar as consultas.",
  });

  function openDetails(solicitationId: string) {
    navigation.navigate("Solicitações", {
      screen: "FuncionarioSolicitationDetails",
      params: {
        solicitationId,
        origin: "CONSULTAS",
      },
    });
  }

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  function renderEmpty(
    hasSourceData: boolean,
    title: string,
    initialMessage: string
  ) {
    return (
      <ScrollView
        alwaysBounceVertical
        style={styles.emptyList}
        contentContainerStyle={styles.emptyListContent}
        refreshControl={refreshControl}
      >
        <AppCard>
          <EmptyState
            icon="search"
            title={title}
            message={
              hasSourceData
                ? "Tente alterar a busca ou os filtros aplicados."
                : initialMessage
            }
          />
        </AppCard>
      </ScrollView>
    );
  }

  function renderAllocation({ item }: { item: ResourceAllocation }) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openDetails(item.solicitacaoId)}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>{item.recursoNome}</Text>
              <Text style={styles.cardSubtitle}>
                {item.recursoTipo === "MAQUINA" ? "Máquina" : "Ferramenta"}
                {" • "}
                Quantidade: {item.quantidade}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                item.situacao === "RETIRADO"
                  ? styles.withdrawnBadge
                  : styles.reservedBadge,
              ]}
            >
              <Text style={styles.badgeText}>
                {item.situacao === "RETIRADO" ? "Retirado" : "Reservado"}
              </Text>
            </View>
          </View>

          {item.atrasado && (
            <View style={styles.overdueRow}>
              <Feather name="alert-triangle" size={15} color={colors.error} />
              <Text style={styles.overdueText}>Devolução em atraso</Text>
            </View>
          )}

          <View style={styles.details}>
            <Text style={styles.detailText}>
              {getSolicitationCode(item.solicitacaoId)} • {item.professorNome}
            </Text>
            <Text style={styles.detailText}>
              {item.dataUtilizacao} • {getShiftLabel(item.turno)}
            </Text>
          </View>

          <View style={styles.openRow}>
            <Text style={styles.openText}>Ver solicitação</Text>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  }

  function renderHistory({ item }: { item: SolicitationHistoryEntry }) {
    const solicitation = item.solicitation;
    const resourceNames = getSolicitationResourceNames(solicitation);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openDetails(solicitation.id)}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardTitle}>
                {getSolicitationCode(solicitation.id)}
              </Text>
              <Text style={styles.cardSubtitle}>
                {solicitation.professorNome}
              </Text>
            </View>

            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>
                {getStatusLabel(solicitation.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.resourcesText} numberOfLines={2}>
            {resourceNames.length > 0
              ? resourceNames.join(", ")
              : "Nenhum recurso informado"}
          </Text>

          <View style={styles.details}>
            <Text style={styles.detailText}>
              Data de uso: {solicitation.dataUtilizacao} •{" "}
              {getShiftLabel(solicitation.turno)}
            </Text>
            <Text style={styles.detailText}>
              Finalizada em: {formatTimestamp(item)}
            </Text>
            <Text style={styles.detailText}>
              Responsável: {item.terminalResponsibleName}
            </Text>
          </View>

          <View style={styles.openRow}>
            <Text style={styles.openText}>Ver solicitação e auditoria</Text>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </View>
        </AppCard>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return <Loading message="Carregando consultas..." />;
  }

  return (
    <ScreenContainer>
      <View style={styles.tabs}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "ALLOCATIONS" }}
          style={[
            styles.tab,
            activeTab === "ALLOCATIONS" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("ALLOCATIONS")}
        >
          <Feather
            name="package"
            size={17}
            color={
              activeTab === "ALLOCATIONS"
                ? colors.white
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "ALLOCATIONS" && styles.activeTabText,
            ]}
          >
            Recursos alocados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "HISTORY" }}
          style={[
            styles.tab,
            activeTab === "HISTORY" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("HISTORY")}
        >
          <Feather
            name="clock"
            size={17}
            color={
              activeTab === "HISTORY"
                ? colors.white
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "HISTORY" && styles.activeTabText,
            ]}
          >
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={styles.alert}>
          <AppAlert variant="error" title="Erro na consulta" message={error} />
        </View>
      )}

      {activeTab === "ALLOCATIONS" ? (
        <>
          <AppListFilter
            search={allocationSearch}
            onSearchChange={setAllocationSearch}
            searchPlaceholder="Buscar por recurso, solicitação ou professor"
            filters={allocationFilterDefinitions}
            activeFilters={allocationFilters}
            onFiltersChange={setAllocationFilters}
            sorts={allocationSorts}
            activeSort={allocationSort}
            onSortChange={setAllocationSort}
          />

          {filteredAllocations.length === 0 ? (
            renderEmpty(
              allocations.length > 0,
              "Nenhum recurso alocado",
              "Recursos reservados ou retirados aparecerão aqui."
            )
          ) : (
            <FlatList
              data={filteredAllocations}
              keyExtractor={(item) => item.id}
              renderItem={renderAllocation}
              refreshControl={refreshControl}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : historyLoading ? (
        <Loading message="Carregando histórico e auditoria..." />
      ) : (
        <>
          <AppListFilter
            search={historySearch}
            onSearchChange={setHistorySearch}
            searchPlaceholder="Buscar por solicitação, professor ou recurso"
            filters={historyFilterDefinitions}
            activeFilters={historyFilters}
            onFiltersChange={setHistoryFilters}
            sorts={historySorts}
            activeSort={historySort}
            onSortChange={setHistorySort}
          />

          {filteredHistory.length === 0 ? (
            renderEmpty(
              history.length > 0,
              "Nenhuma solicitação no histórico",
              "Solicitações encerradas, recusadas e canceladas aparecerão aqui."
            )
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.solicitation.id}
              renderItem={renderHistory}
              refreshControl={refreshControl}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
