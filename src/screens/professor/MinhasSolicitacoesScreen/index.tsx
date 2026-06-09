import React, { useEffect, useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { PageTitle } from "../../../components/PageTitle";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { AppAlert } from "../../../components/AppAlert";
import { AllFilters } from "../../../components/Allfilters";

import { useAuth } from "../../../contexts/AuthContext";
import {
  isSolicitationOverdue,
  listSolicitationsByProfessor,
} from "../../../services/solicitations/solicitationServices";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MinhasSolicitacoesStackParamList } from "../../../routes/MinhasSolicitacoesStackRoutes";

import { styles } from "./styles";

type Solicitation = any;

const statusFilters = [
  "Todos",
  "Pendente",
  "Aprovada",
  "Recusada",
  "Em uso",
  "Encerrada",
  "Cancelada",
];

const priorityFilters = [
  "Todas",
  "Normal",
  "Imediata",
];

const orderFilters = [
  "Status",
  "Data de uso",
  "Criados recentemente",
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

function getStatusStyle(status: string) {
  const stylesByStatus: Record<string, any> = {
    PENDENTE: styles.badgePending,
    APROVADA: styles.badgeReady,
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
    PENDENTE: 3,
    EM_USO: 4,
    RECUSADA: 5,
    CANCELADA: 6,
    ENCERRADA: 7,
  };

  return priorities[item.status] ?? 99;
}

export function MinhasSolicitacoesScreen() {
  const { appUser } = useAuth();

  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("Todos");
  const [orderFilter, setOrderFilter] = useState("Status");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const navigation =
    useNavigation<NativeStackNavigationProp<MinhasSolicitacoesStackParamList>>();

  async function loadSolicitations() {
    if (!appUser) return;

    try {
      setLoading(true);

      const data = await listSolicitationsByProfessor(appUser.id);

      setSolicitations(data);
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

  const filteredSolicitations = useMemo(() => {
    let data = [...solicitations];

    data = data.filter((item) => {
      if (statusFilter === "Todos") return true;
      if (statusFilter === "Pendente") return item.status === "PENDENTE";
      if (statusFilter === "Aprovada") return item.status === "APROVADA";
      if (statusFilter === "Recusada") return item.status === "RECUSADA";
      if (statusFilter === "Em uso") return item.status === "EM_USO";
      if (statusFilter === "Encerrada") return item.status === "ENCERRADA";
      if (statusFilter === "Cancelada") return item.status === "CANCELADA";

      return true;
    });

    data = data.filter((item) => {
      if (priorityFilter === "Todas") return true;
      if (priorityFilter === "Normal") return item.prioridade === "NORMAL";
      if (priorityFilter === "Imediata") return item.prioridade === "IMEDIATA";

      return true;
    });

    data.sort((a, b) => {
      const overdueDiff =
        Number(isOverdue(b, currentTime)) -
        Number(isOverdue(a, currentTime));

      if (overdueDiff !== 0) {
        return overdueDiff;
      }

      if (orderFilter === "Status") {
        return (
          getStatusPriority(a, currentTime) -
          getStatusPriority(b, currentTime)
        );
      }

      if (orderFilter === "Data de uso") {
        return String(b.dataUtilizacao).localeCompare(String(a.dataUtilizacao));
      }

      if (orderFilter === "Criados recentemente") {
        const aSeconds = a.createdAt?.seconds ?? 0;
        const bSeconds = b.createdAt?.seconds ?? 0;

        return bSeconds - aSeconds;
      }

      return 0;
    });

    return data;
  }, [
    solicitations,
    statusFilter,
    priorityFilter,
    orderFilter,
    currentTime,
  ]);

  if (loading) {
    return <Loading message="Carregando solicitações..." />;
  }

  return (
    <ScreenContainer>
      <AppAlert
        variant="info"
        title="Lembrete:"
        message="A devolução é obrigatória ao final do mesmo turno."
      />

      <View style={styles.filterGroup}>
        <Text style={styles.filterTitle}>Status</Text>

        <AllFilters
          filters={statusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterTitle}>Prioridade</Text>

        <AllFilters
          filters={priorityFilters}
          selectedFilter={priorityFilter}
          onSelectFilter={setPriorityFilter}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterTitle}>Ordenar por</Text>

        <AllFilters
          filters={orderFilters}
          selectedFilter={orderFilter}
          onSelectFilter={setOrderFilter}
        />
      </View>

      {filteredSolicitations.length === 0 ? (
        <AppCard>
          <EmptyState
            icon="file-text"
            title="Nenhuma solicitação encontrada"
            message="Suas solicitações aparecerão aqui."
          />
        </AppCard>
      ) : (
        <FlatList
          data={filteredSolicitations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ProfessorSolicitationDetails", {
                  solicitation: item,
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
