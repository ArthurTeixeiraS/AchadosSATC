import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
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
import { listGlobalAuditEntries } from "../../../services/solicitations/auditReportServices";
import { getAuditEventLabel } from "../../../services/solicitations/solicitationAuditServices";
import { AuditReportEntry } from "../../../types/AuditReport";
import {
  AuditEventType,
  ResourceAuditEvent,
} from "../../../types/Audit";
import {
  SolicitationAuditEvent,
  SolicitationStatus,
} from "../../../types/Solicitation";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

const eventTypes: readonly AuditEventType[] = [
  "CRIACAO",
  "ALTERACAO",
  "ALTERACAO_ITEM_APROVADO",
  "ALTERACAO_ITEM_RECUSADO",
  "APROVACAO",
  "RECUSA",
  "CANCELAMENTO",
  "RETIRADA",
  "DEVOLUCAO_PARCIAL",
  "DEVOLUCAO_INTEGRAL",
  "RECURSO_CRIACAO",
  "RECURSO_EDICAO",
  "RECURSO_REMOCAO",
  "ESTOQUE_ENTRADA",
  "ESTOQUE_SAIDA",
  "ESTOQUE_AJUSTE",
];

const sorts: readonly SortDefinition<AuditReportEntry>[] = [
  {
    key: "date-desc",
    label: "Eventos mais recentes",
    compare: (a, b) => compareDates(a.timestampMillis, b.timestampMillis, true),
  },
  {
    key: "date-asc",
    label: "Eventos mais antigos",
    compare: (a, b) => compareDates(a.timestampMillis, b.timestampMillis, false),
  },
];

function compareDates(a: number, b: number, descending: boolean) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return descending ? b - a : a - b;
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

function formatTimestamp(timestampMillis: number) {
  if (!timestampMillis) return "Data não informada";

  return new Date(timestampMillis).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getProfileLabel(profile?: string) {
  if (profile === "PROFESSOR") return "Professor";
  if (profile === "FUNCIONARIO") return "Funcionário";
  return "Perfil não identificado";
}

function getStatusLabel(status?: SolicitationStatus) {
  const labels: Partial<Record<SolicitationStatus, string>> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    ALTERACAO_PENDENTE: "Alteração pendente",
    RECUSADA: "Recusada",
    EM_USO: "Em uso",
    ENCERRADA: "Encerrada",
    CANCELADA: "Cancelada",
  };

  return status ? labels[status] ?? status : "";
}

function searchEntry(item: AuditReportEntry, search: string) {
  const resourceEvent =
    item.entityType === "RECURSO"
      ? (item.event as ResourceAuditEvent)
      : null;

  return [
    item.entityLabel,
    item.entityId,
    item.event.responsavel?.nome,
    item.event.resumo,
    getAuditEventLabel(item.event.tipo),
    resourceEvent?.recursoNome,
    resourceEvent?.solicitacaoId,
    ...(
      item.entityType === "SOLICITACAO"
        ? (item.event as SolicitationAuditEvent).itens?.map(
            (resource) => resource.nome
          ) ?? []
        : []
    ),
  ].some((value) => normalizeFilterText(value).includes(search));
}

const AuditReportCard = React.memo(function AuditReportCard({
  item,
  onPress,
}: {
  item: AuditReportEntry;
  onPress: (item: AuditReportEntry) => void;
}) {
  const event = item.event;
  const isResourceEvent = item.entityType === "RECURSO";
  const resourceEvent = isResourceEvent
    ? (event as ResourceAuditEvent)
    : null;
  const solicitationEvent = !isResourceEvent
    ? (event as SolicitationAuditEvent)
    : null;
  const statusChange =
    solicitationEvent?.statusAnterior && solicitationEvent.statusNovo
      ? `${getStatusLabel(solicitationEvent.statusAnterior)} → ${getStatusLabel(solicitationEvent.statusNovo)}`
      : null;
  const entityAvailable = isResourceEvent
    ? Boolean(item.resource)
    : Boolean(item.solicitation);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(item)}>
      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <Feather
              name={isResourceEvent ? "box" : "activity"}
              size={18}
              color={colors.primary}
            />
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.title}>
              {getAuditEventLabel(event.tipo)}
            </Text>
            <Text style={styles.code}>
              {isResourceEvent
                ? `Recurso • ${item.entityLabel}`
                : item.entityLabel}
            </Text>
          </View>

          {solicitationEvent?.derivado && (
            <View style={styles.legacyBadge}>
              <Text style={styles.legacyBadgeText}>Histórico</Text>
            </View>
          )}
        </View>

        <Text style={styles.summary}>{event.resumo}</Text>

        <View style={styles.details}>
          <Text style={styles.detailText}>
            Responsável: {event.responsavel?.nome ?? "Não identificado"}
            {" • "}
            {getProfileLabel(event.responsavel?.perfil)}
          </Text>
          <Text style={styles.detailText}>
            {formatTimestamp(item.timestampMillis)}
          </Text>
          {!!statusChange && (
            <Text style={styles.detailText}>Status: {statusChange}</Text>
          )}
          {!!solicitationEvent?.motivo && (
            <Text style={styles.reason}>
              Motivo: {solicitationEvent.motivo}
            </Text>
          )}
        </View>

        {!!solicitationEvent?.itens?.length && (
          <Text style={styles.items} numberOfLines={3}>
            Recursos:{" "}
            {solicitationEvent.itens
              .map((resource) =>
                resource.quantidade > 1
                  ? `${resource.nome} (${resource.quantidade})`
                  : resource.nome
              )
              .join(", ")}
          </Text>
        )}

        {!!resourceEvent?.alteracoes?.length && (
          <View style={styles.changes}>
            {resourceEvent.alteracoes.map((change, index) => (
              <Text
                key={`${change.campo}-${index}`}
                style={styles.changeText}
              >
                {change.campo}:{" "}
                {String(change.valorAnterior ?? "Não informado")}
                {" → "}
                {String(change.valorNovo ?? "Não informado")}
              </Text>
            ))}
          </View>
        )}

        {!!resourceEvent?.solicitacaoId && (
          <Text style={styles.relatedText}>
            Solicitação relacionada:{" "}
            {`SL-${resourceEvent.solicitacaoId.slice(0, 4).toUpperCase()}`}
          </Text>
        )}

        <View style={styles.openRow}>
          <Text style={styles.openText}>
            {entityAvailable
              ? isResourceEvent
                ? "Ver recurso"
                : "Ver solicitação"
              : isResourceEvent
                ? "Recurso indisponível"
                : "Solicitação indisponível"}
          </Text>
          <Feather
            name={entityAvailable ? "chevron-right" : "alert-circle"}
            size={16}
            color={
              entityAvailable ? colors.primary : colors.textSecondary
            }
          />
        </View>
      </AppCard>
    </TouchableOpacity>
  );
});

export function AuditReportScreen() {
  const navigation = useNavigation<any>();
  const [entries, setEntries] = useState<AuditReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] =
    useState<ActiveListFilters>({});
  const [activeSort, setActiveSort] = useState("date-desc");

  const loadEntries = useCallback(async () => {
    const data = await listGlobalAuditEntries();
    setEntries(data);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await listGlobalAuditEntries();

        if (active) {
          setEntries(data);
          setError(null);
        }
      } catch (loadError) {
        console.log("Erro ao carregar auditoria global:", loadError);

        if (active) {
          setError("Não foi possível carregar os eventos de auditoria.");
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
  }, []);

  const filterDefinitions = useMemo<
    readonly FilterDefinition<AuditReportEntry>[]
  >(
    () => [
      {
        key: "entidade",
        label: "Entidade",
        type: "select",
        options: [
          { label: "Solicitação", value: "SOLICITACAO" },
          { label: "Recurso", value: "RECURSO" },
        ],
        predicate: (item, value) => item.entityType === value,
      },
      {
        key: "tipo",
        label: "Operação",
        type: "select",
        options: eventTypes.map((type) => ({
          label: getAuditEventLabel(type),
          value: type,
        })),
        predicate: (item, value) => item.event.tipo === value,
      },
      {
        key: "perfil",
        label: "Perfil do responsável",
        type: "select",
        options: [
          { label: "Professor", value: "PROFESSOR" },
          { label: "Funcionário", value: "FUNCIONARIO" },
        ],
        predicate: (item, value) => item.event.responsavel?.perfil === value,
      },
      {
        key: "recurso",
        label: "Recurso",
        type: "text",
        predicate: (item, value) => {
          const normalizedValue = normalizeFilterText(value);

          if (item.entityType === "RECURSO") {
            const event = item.event as ResourceAuditEvent;
            return normalizeFilterText(event.recursoNome).includes(
              normalizedValue
            );
          }

          return Boolean(
            (item.event as SolicitationAuditEvent).itens?.some((resource) =>
              normalizeFilterText(resource.nome).includes(normalizedValue)
            )
          );
        },
      },
      {
        key: "dataInicial",
        label: "Data inicial",
        type: "date",
        predicate: (item, value) => {
          const start = parseFilterDate(value);
          return Boolean(
            item.timestampMillis &&
              start &&
              item.timestampMillis >= start
          );
        },
      },
      {
        key: "dataFinal",
        label: "Data final",
        type: "date",
        predicate: (item, value) => {
          const end = parseFilterDate(value, true);
          return Boolean(
            item.timestampMillis &&
              end &&
              item.timestampMillis <= end
          );
        },
      },
    ],
    []
  );

  const filteredEntries = useListFilter({
    data: entries,
    search,
    filters: filterDefinitions,
    activeFilters,
    sorts,
    activeSort,
    searchPredicate: searchEntry,
  });

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: loadEntries,
    errorMessage:
      "Não foi possível atualizar os eventos. Os dados anteriores foram mantidos.",
  });

  const openEntity = useCallback((item: AuditReportEntry) => {
    if (item.entityType === "RECURSO") {
      if (!item.resource) {
        Alert.alert(
          "Recurso indisponível",
          "O evento permanece disponível, mas o recurso relacionado foi removido."
        );
        return;
      }

      navigation.navigate("Recursos", {
        screen: "ResourceDetails",
        params: {
          resource: item.resource,
          origin: "AUDITORIA",
        },
      });
      return;
    }

    if (!item.solicitation) {
      Alert.alert(
        "Solicitação indisponível",
        "O evento permanece disponível, mas a solicitação relacionada não foi encontrada."
      );
      return;
    }

    navigation.navigate("Solicitações", {
      screen: "FuncionarioSolicitationDetails",
      params: {
        solicitationId: item.entityId,
        origin: "AUDITORIA",
      },
    });
  }, [navigation]);

  const renderEntry = useCallback<ListRenderItem<AuditReportEntry>>(
    ({ item }) => <AuditReportCard item={item} onPress={openEntity} />,
    [openEntity]
  );

  const keyExtractor = useCallback(
    (item: AuditReportEntry) => item.id,
    []
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  if (loading) {
    return <Loading message="Carregando auditoria..." />;
  }

  return (
    <ScreenContainer>
      {!!error && (
        <View style={styles.alert}>
          <AppAlert
            variant="error"
            title="Erro na auditoria"
            message={error}
          />
        </View>
      )}

      <AppListFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por entidade, responsável ou operação"
        filters={filterDefinitions}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        sorts={sorts}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      {filteredEntries.length === 0 ? (
        <ScrollView
          alwaysBounceVertical
          style={styles.emptyList}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
        >
          <AppCard>
            <EmptyState
              icon="activity"
              title="Nenhum evento encontrado"
              message={
                entries.length > 0
                  ? "Tente alterar a busca ou os filtros aplicados."
                  : "As operações realizadas nas solicitações aparecerão aqui."
              }
            />
          </AppCard>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={keyExtractor}
          renderItem={renderEntry}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}
    </ScreenContainer>
  );
}
