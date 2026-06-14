import React, { useEffect, useMemo, useState } from "react";
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
import { AppAlert } from "../../../components/AppAlert";
import {
  ActiveListFilters,
  AppListFilter,
  FilterDefinition,
  normalizeFilterText,
  SortDefinition,
  useListFilter,
} from "../../../components/AppListFilter";

import { useAuth } from "../../../contexts/AuthContext";
import {
  isSolicitationOverdue,
  listSolicitationsByProfessor,
} from "../../../services/solicitations/solicitationServices";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MinhasSolicitacoesStackParamList } from "../../../routes/MinhasSolicitacoesStackRoutes";
import { Solicitation } from "../../../types/Solicitation";

import { styles } from "./styles";
import { colors } from "../../../styles/colors";
import { useManualRefresh } from "../../../hooks/useManualRefresh";

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

function getStatusStyle(status: string) {
  const stylesByStatus: Record<string, any> = {
    PENDENTE: styles.badgePending,
    APROVADA: styles.badgeReady,
    ALTERACAO_PENDENTE: styles.badgePending,
    EM_USO: styles.badgeInUse,
    ENCERRADA: styles.badgeFinished,
    RECUSADA: styles.badgeRejected,
  };

  return stylesByStatus[status] ?? styles.badgePending;
}

function getTurnoLabel(turno: string) {
  const labels: Record<string, string> = {
    TARDE: "Tarde",
    NOITE: "Noite",
  };

  return labels[turno] ?? turno;
}

function getItemSummary(item: Solicitation) {
  const maquinas =
    item.maquinas?.map((machine: any) => machine.nome) ?? [];

  const ferramentas =
    item.ferramentas?.map((tool: any) => tool.nome) ?? [];

  return [...maquinas, ...ferramentas].join(", ");
}

function isOverdue(item: Solicitation, now: Date) {
  return isSolicitationOverdue(item, now);
}

function getStatusPriority(item: Solicitation, now: Date) {
  if (isOverdue(item, now)) return 0;

  if (item.prioridade === "IMEDIATA" && item.status === "PENDENTE") {
    return 1;
  }

  const priorities: Record<string, number> = {
    APROVADA: 2,
    ALTERACAO_PENDENTE: 3,
    PENDENTE: 4,
    EM_USO: 5,
    RECUSADA: 6,
    CANCELADA: 7,
    ENCERRADA: 8,
  };

  return priorities[item.status] ?? 99;
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

const mySolicitationFilters: readonly FilterDefinition<Solicitation>[] = [
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

function searchMySolicitation(item: Solicitation, search: string) {
  const resourceNames = [
    ...item.maquinas.map((machine) => machine.nome),
    ...item.ferramentas.map((tool) => tool.nome),
  ];

  return [
    item.id,
    `SL-${item.id.slice(0, 4).toUpperCase()}`,
    item.atividade,
    ...resourceNames,
  ].some((value) => normalizeFilterText(value).includes(search));
}

export function MinhasSolicitacoesScreen() {
  const { appUser } = useAuth();

  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({
      fromToday: "true",
    });
  const [activeSort, setActiveSort] = useState("status-priority");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const navigation =
    useNavigation<NativeStackNavigationProp<MinhasSolicitacoesStackParamList>>();

  async function fetchSolicitations() {
    if (!appUser) return;

    const data = await listSolicitationsByProfessor(appUser.id);
    setSolicitations(data);
  }

  async function loadSolicitations() {
    if (!appUser) return;

    try {
      setLoading(true);
      await fetchSolicitations();
    } catch (error) {
      console.log("Erro ao buscar solicitações:", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSolicitations();
    }, [appUser])
  );

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: fetchSolicitations,
    errorMessage:
      "Não foi possível atualizar suas solicitações. Tente novamente.",
  });

  const mySolicitationSorts = useMemo<
    readonly SortDefinition<Solicitation>[]
  >(
    () => [
      {
        key: "status-priority",
        label: "Prioridade por status",
        compare: (a, b) =>
          getStatusPriority(a, currentTime) -
          getStatusPriority(b, currentTime),
      },
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
    ],
    [currentTime]
  );

  const filteredSolicitations = useListFilter({
    data: solicitations,
    search,
    filters: mySolicitationFilters,
    activeFilters,
    sorts: mySolicitationSorts,
    activeSort,
    searchPredicate: searchMySolicitation,
  });

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
      <AppAlert
        variant="info"
        title="Lembrete:"
        message="A devolução é obrigatória ao final do mesmo turno."
      />

      <AppListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código, atividade ou recurso"
        filters={mySolicitationFilters}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={mySolicitationSorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {filteredSolicitations.length === 0 ? (
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
                  ? "Suas solicitações aparecerão aqui."
                  : "Tente alterar a busca ou os filtros aplicados."
              }
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredSolicitations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ProfessorSolicitationDetails", {
                  solicitationId: item.id,
                })
              }
            >
              <AppCard style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.code}>SL-{item.id.slice(0, 4).toUpperCase()}</Text>

                    <Text style={styles.date}>
                      {item.dataUtilizacao} - {getTurnoLabel(item.turno)}
                    </Text>
                  </View>

                  {item.prioridade === "IMEDIATA" && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityBadgeText}>Imediata</Text>
                    </View>
                  )}

                  <View style={[styles.badge, getStatusStyle(item.status)]}>
                    <Text style={styles.badgeText}>
                      {isOverdue(item, currentTime)
                        ? "Atrasado"
                        : getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                {isOverdue(item, currentTime) && (
                  <View style={styles.overdueBox}>
                    <Text style={styles.overdueText}>
                      Item com devolução em atraso. Entre em contato com a ferramentaria.
                    </Text>
                  </View>
                )}

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Resumo dos itens:</Text>
                  <Text style={styles.summaryText}>
                    {getItemSummary(item) || "Nenhum item informado"}
                  </Text>
                </View>
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}
