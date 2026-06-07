import React, { useCallback, useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppInput } from "../../../components/AppInput";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { AllFilters } from "../../../components/Allfilters";
import { AppAlert } from "../../../components/AppAlert";

import { listSolicitations } from "../../../services/solicitations/solicitationServices";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";

type Solicitation = any;

type SolicitationGroup = {
  date: string;
  items: Solicitation[];
};

const statusFilters = [
  "Todos",
  "Pendente",
  "Imediata",
  "Aprovada",
  "Em uso",
];

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
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

function isOverdue(item: Solicitation) {
  return item.status === "EM_USO" && item.atrasada === true;
}

export function SolicitacoesRecebidasScreen() {
  const navigation = useNavigation<any>();

  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  async function loadSolicitations() {
    try {
      setLoading(true);

      const data = await listSolicitations();

      setSolicitations(data as Solicitation[]);
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

  function toggleDate(date: string) {
    setExpandedDates((current) => {
      if (current.includes(date)) {
        return current.filter((item) => item !== date);
      }

      return [...current, date];
    });
  }

  const overdueSolicitations = useMemo(() => {
    return solicitations.filter(isOverdue);
  }, [solicitations]);

  const groupedSolicitations = useMemo<SolicitationGroup[]>(() => {
    let data = solicitations.filter((item) => !isOverdue(item));

    data = data.filter((item) => {
      if (statusFilter === "Todos") return true;
      if (statusFilter === "Pendente") return item.status === "PENDENTE";
      if (statusFilter === "Imediata") return item.prioridade === "IMEDIATA";
      if (statusFilter === "Aprovada") return item.status === "APROVADA";
      if (statusFilter === "Em uso") return item.status === "EM_USO";

      return true;
    });

    data = data.filter((item) => {
      if (!search.trim()) return true;

      const text = search.toLowerCase();

      return (
        item.professorNome?.toLowerCase().includes(text) ||
        item.professorCracha?.toLowerCase().includes(text) ||
        item.id?.toLowerCase().includes(text) ||
        getSolicitationCode(item.id).toLowerCase().includes(text)
      );
    });

    const groups: Record<string, Solicitation[]> = {};

    data.forEach((item) => {
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
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [solicitations, search, statusFilter]);

  function renderSolicitationCard(item: Solicitation) {
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

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.itemSummary}>
            <Text style={styles.itemSummaryText}>
              {getItemsCount(item)} item{getItemsCount(item) !== 1 ? "s" : ""}
            </Text>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsText}>Ver detalhes</Text>
              <Feather
                name="chevron-right"
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

  return (
    <ScreenContainer>
      <PageTitle
        title="Itens a aprovar"
        subtitle="Acompanhe e gerencie as solicitações recebidas."
      />

      <AppInput
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por professor, crachá ou código"
        left={<TextInput.Icon icon="magnify" />}
        style={styles.searchInput}
      />

      <View style={styles.filterGroup}>
        <Text style={styles.filterTitle}>Status</Text>

        <AllFilters
          filters={statusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />
      </View>

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
        <AppCard>
          <EmptyState
            icon="file-text"
            title="Nenhuma solicitação encontrada"
            message="As solicitações dos professores aparecerão aqui."
          />
        </AppCard>
      ) : (
        <FlatList
          data={groupedSolicitations}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
                      {item.items.length} solicitação
                      {item.items.length !== 1 ? "ões" : ""}
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