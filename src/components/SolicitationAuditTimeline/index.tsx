import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { AppAlert } from "../AppAlert";
import { AppCard } from "../AppCard";
import {
  getAuditEventLabel,
  listSolicitationAuditEvents,
} from "../../services/solicitations/solicitationAuditServices";
import {
  Solicitation,
  SolicitationAuditEvent,
  SolicitationTimestamp,
} from "../../types/Solicitation";
import { colors } from "../../styles/colors";

import { styles } from "./styles";

interface Props {
  solicitation: Solicitation;
}

function formatTimestamp(timestamp?: SolicitationTimestamp | null) {
  if (!timestamp) return "Data não disponível";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp.seconds * 1000);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatItems(event: SolicitationAuditEvent) {
  if (!event.itens?.length) return null;

  return event.itens
    .map((item) =>
      item.tipo === "FERRAMENTA"
        ? `${item.quantidade}x ${item.nome}`
        : item.nome
    )
    .join(", ");
}

export function SolicitationAuditTimeline({ solicitation }: Props) {
  const [events, setEvents] = useState<SolicitationAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setHasError(false);

        const data = await listSolicitationAuditEvents(solicitation);

        if (active) {
          setEvents(data);
        }
      } catch (error) {
        console.log("Erro ao carregar auditoria da solicitação:", error);

        if (active) {
          setHasError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [
    solicitation.id,
    solicitation.status,
    solicitation.updatedAt?.seconds,
  ]);

  return (
    <AppCard>
      <Text style={styles.title}>Histórico da solicitação</Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      )}

      {hasError && (
        <AppAlert
          variant="warning"
          title="Histórico indisponível."
          message="Não foi possível carregar a auditoria desta solicitação."
        />
      )}

      {!loading && !hasError && events.length === 0 && (
        <Text style={styles.emptyText}>
          Nenhum evento de auditoria disponível.
        </Text>
      )}

      {!loading &&
        events.map((event, index) => {
          const items = formatItems(event);
          const isLast = index === events.length - 1;

          return (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.markerColumn}>
                <View style={styles.marker}>
                  <Feather
                    name="check"
                    size={14}
                    color={colors.white}
                  />
                </View>

                {!isLast && <View style={styles.connector} />}
              </View>

              <View style={[styles.eventContent, isLast && styles.lastEvent]}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>
                    {event.resumo || getAuditEventLabel(event.tipo)}
                  </Text>
                  <Text style={styles.eventDate}>
                    {formatTimestamp(event.createdAt)}
                  </Text>
                </View>

                <Text style={styles.actorText}>
                  {event.responsavel.nome} ·{" "}
                  {event.responsavel.perfil === "PROFESSOR"
                    ? "Professor"
                    : "Funcionário"}
                </Text>

                {!!event.motivo && (
                  <Text style={styles.detailText}>
                    Motivo: {event.motivo}
                  </Text>
                )}

                {!!items && (
                  <Text style={styles.detailText}>Itens: {items}</Text>
                )}

                {event.derivado && (
                  <Text style={styles.legacyText}>
                    Evento recuperado do histórico da solicitação
                  </Text>
                )}
              </View>
            </View>
          );
        })}
    </AppCard>
  );
}
