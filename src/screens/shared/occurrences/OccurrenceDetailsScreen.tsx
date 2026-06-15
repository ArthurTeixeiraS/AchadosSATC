import React, { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";

import { AppAlert } from "../../../components/AppAlert";
import { AppButton } from "../../../components/AppButton";
import { AppCard } from "../../../components/AppCard";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { AppInput } from "../../../components/AppInput";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { OccurrenceStackParamList } from "../../../routes/OccurrenceStackRoutes";
import {
  addOccurrenceComment,
  advanceOccurrenceStatus,
  getOccurrenceById,
  listOccurrenceEvents,
  OccurrenceBusinessError,
  setOccurrenceMaintenance,
} from "../../../services/occurrences/occurrenceServices";
import {
  Occurrence,
  OccurrenceEvent,
  OccurrenceStatus,
} from "../../../types/Occurrence";
import { getAuditEventLabel } from "../../../services/solicitations/solicitationAuditServices";
import { styles } from "./styles";

type Props = NativeStackScreenProps<
  OccurrenceStackParamList,
  "OccurrenceDetails"
>;

function getMillis(timestamp?: Occurrence["createdAt"]) {
  if (!timestamp) return 0;
  return timestamp.toDate
    ? timestamp.toDate().getTime()
    : timestamp.seconds * 1000;
}

function formatDate(timestamp?: Occurrence["createdAt"]) {
  const millis = getMillis(timestamp);
  return millis
    ? new Date(millis).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Data não informada";
}

function getStatusLabel(status: OccurrenceStatus) {
  return {
    ABERTA: "Aberta",
    EM_ANALISE: "Em análise",
    ENCERRADA: "Encerrada",
  }[status];
}

export function OccurrenceDetailsScreen({ route }: Props) {
  const { appUser } = useAuth();
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null);
  const [events, setEvents] = useState<OccurrenceEvent[]>([]);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [occurrenceData, eventData] = await Promise.all([
      getOccurrenceById(route.params.occurrenceId),
      listOccurrenceEvents(route.params.occurrenceId),
    ]);
    setOccurrence(occurrenceData);
    setEvents(eventData);
    setError(null);
  }, [route.params.occurrenceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function run() {
        try {
          setLoading(true);
          const [occurrenceData, eventData] = await Promise.all([
            getOccurrenceById(route.params.occurrenceId),
            listOccurrenceEvents(route.params.occurrenceId),
          ]);
          if (active) {
            setOccurrence(occurrenceData);
            setEvents(eventData);
            setError(null);
          }
        } catch (loadError) {
          console.log("Erro ao carregar ocorrência:", loadError);
          if (active) setError("Não foi possível carregar a ocorrência.");
        } finally {
          if (active) setLoading(false);
        }
      }

      void run();
      return () => {
        active = false;
      };
    }, [route.params.occurrenceId])
  );

  async function execute(action: () => Promise<void>, message: string) {
    if (!appUser || actionLoading) return;

    try {
      setActionLoading(true);
      setError(null);
      await action();
      setObservation("");
      await load();
      Alert.alert("Sucesso", message);
    } catch (actionError) {
      console.log("Erro na ocorrência:", actionError);
      setError(
        actionError instanceof OccurrenceBusinessError
          ? actionError.message
          : "Não foi possível concluir a operação."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando ocorrência..." />;
  }

  if (!occurrence) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="alert-triangle"
          title="Ocorrência não encontrada"
          message="O registro solicitado não está disponível."
        />
      </ScreenContainer>
    );
  }

  const isEmployee = appUser?.tipoUsuario === "FUNCIONARIO";
  const canComment = isEmployee && occurrence.status !== "ENCERRADA";
  const canAdvance = isEmployee && occurrence.status !== "ENCERRADA";
  const canEnableMaintenance =
    isEmployee &&
    occurrence.status === "EM_ANALISE" &&
    !occurrence.manutencaoAtiva;
  const canDisableMaintenance =
    isEmployee && occurrence.manutencaoAtiva === true;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        {!!error && <AppAlert variant="error" message={error} />}

        <AppCard>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.title}>{occurrence.recurso.nome}</Text>
              <Text style={styles.subtitle}>
                {occurrence.recurso.tipo === "FERRAMENTA"
                  ? "Ferramenta"
                  : occurrence.recurso.tipo === "MAQUINA"
                    ? "Máquina"
                    : "Laboratório"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {getStatusLabel(occurrence.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.description}>{occurrence.descricao}</Text>
          <View style={styles.details}>
            <Text style={styles.detailText}>
              Autor: {occurrence.autor.nome}
            </Text>
            <Text style={styles.detailText}>
              Aberta em: {formatDate(occurrence.createdAt)}
            </Text>
            <Text style={styles.detailText}>
              Manutenção: {occurrence.manutencaoAtiva ? "Ativa" : "Não"}
            </Text>
          </View>
        </AppCard>

        {isEmployee && (
          <AppCard>
            <Text style={styles.sectionTitle}>Ações administrativas</Text>
            <AppInput
              value={observation}
              onChangeText={setObservation}
              label="Observação"
              placeholder="Descreva a análise ou decisão"
              multiline
              numberOfLines={4}
            />
            <View style={styles.actions}>
              {canComment && (
                <AppButton
                  mode="outlined"
                  textColor="#03362A"
                  buttonColor="#FFFFFF"
                  loading={actionLoading}
                  onPress={() =>
                    execute(
                      () =>
                        addOccurrenceComment(
                          occurrence.id,
                          observation,
                          appUser
                        ),
                      "Observação registrada."
                    )
                  }
                >
                  Adicionar observação
                </AppButton>
              )}

              {canAdvance && (
                <AppButton
                  loading={actionLoading}
                  onPress={() =>
                    execute(
                      () =>
                        advanceOccurrenceStatus(
                          occurrence.id,
                          observation,
                          appUser
                        ),
                      occurrence.status === "ABERTA"
                        ? "Ocorrência encaminhada para análise."
                        : "Ocorrência encerrada."
                    )
                  }
                >
                  {occurrence.status === "ABERTA"
                    ? "Iniciar análise"
                    : "Encerrar ocorrência"}
                </AppButton>
              )}

              {canEnableMaintenance && (
                <AppDestructiveButton
                  disabled={actionLoading}
                  onPress={() =>
                    execute(
                      () =>
                        setOccurrenceMaintenance(
                          occurrence.id,
                          true,
                          appUser
                        ),
                      "Recurso colocado em manutenção."
                    )
                  }
                >
                  Colocar recurso em manutenção
                </AppDestructiveButton>
              )}

              {canDisableMaintenance && (
                <AppButton
                  loading={actionLoading}
                  onPress={() =>
                    execute(
                      () =>
                        setOccurrenceMaintenance(
                          occurrence.id,
                          false,
                          appUser
                        ),
                      "Recurso retirado da manutenção."
                    )
                  }
                >
                  Retirar recurso da manutenção
                </AppButton>
              )}
            </View>
          </AppCard>
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Histórico</Text>
          <View style={styles.timeline}>
            {events.map((event) => (
              <View key={event.id} style={styles.timelineItem}>
                <Text style={styles.timelineTitle}>
                  {getAuditEventLabel(event.tipo)}
                </Text>
                <Text style={styles.timelineText}>
                  {event.responsavel.nome} • {formatDate(event.createdAt)}
                </Text>
                {!!event.observacao && (
                  <Text style={styles.timelineText}>
                    {event.observacao}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}
