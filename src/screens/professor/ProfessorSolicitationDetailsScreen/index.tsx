import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppAlert } from "../../../components/AppAlert";
import { EmptyState } from "../../../components/EmptyState";
import { getResourceById } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";
import { cancelSolicitation } from "../../../services/solicitations/solicitationServices";

import { MinhasSolicitacoesStackParamList } from "../../../routes/MinhasSolicitacoesStackRoutes";

import { styles } from "./styles";

type Props = NativeStackScreenProps<
  MinhasSolicitacoesStackParamList,
  "ProfessorSolicitationDetails"
>;

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

function getPriorityLabel(priority?: string) {
  const labels: Record<string, string> = {
    NORMAL: "Normal",
    IMEDIATA: "Imediata",
  };

  return labels[priority ?? "NORMAL"] ?? "Normal";
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

function getLaboratoriesText(solicitation: any) {
  const laboratories =
    solicitation.laboratoriosNomes ??
    solicitation.laboratorios ??
    solicitation.laboratoriosIds ??
    [];

  if (!laboratories.length) {
    return "Não informado";
  }

  return laboratories.join(", ");
}

export function ProfessorSolicitationDetailsScreen({
  route,
  navigation,
}: Props) {
  const { solicitation } = route.params;

  const canCancel = solicitation.status === "PENDENTE";
  const isOverdue = solicitation.atrasada === true;

  const [laboratoryNames, setLaboratoryNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLaboratories() {
      const ids = solicitation.laboratoriosIds ?? [];

      const labs = await Promise.all(
        ids.map((id: string) => getResourceById(id))
      );

      setLaboratoryNames(
        labs
          .filter(Boolean)
          .map((lab) => (lab as Resource).nome)
      );
    }

    loadLaboratories();
  }, [solicitation.laboratoriosIds]);

  function handleCancelSolicitation() {
    Alert.alert(
      "Cancelar solicitação",
      "Deseja cancelar esta solicitação? Essa ação não poderá ser desfeita.",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Cancelar solicitação",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              await cancelSolicitation(solicitation.id);

              Alert.alert(
                "Solicitação cancelada",
                "Sua solicitação foi cancelada com sucesso.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.log("Erro ao cancelar solicitação:", error);

              Alert.alert(
                "Erro ao cancelar",
                "Não foi possível cancelar a solicitação. Tente novamente."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppCard>
          <Text style={styles.code}>
            {getSolicitationCode(solicitation.id)}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Professor</Text>
              <Text style={styles.infoValue}>
                {solicitation.professorNome ?? "Não informado"}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Data de uso</Text>
              <Text style={styles.infoValue}>
                {solicitation.dataUtilizacao ?? "Não informado"}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Turno</Text>
              <Text style={styles.infoValue}>
                {getTurnoLabel(solicitation.turno)}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Prioridade</Text>
              <Text style={styles.infoValue}>
                {getPriorityLabel(solicitation.prioridade)}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.statusValue}>
                {getStatusLabel(solicitation.status)}
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Laboratórios</Text>
              <Text style={styles.infoValue}>
                {laboratoryNames.length
                  ? laboratoryNames.join(", ")
                  : "Não informado"}
              </Text>
            </View>
          </View>

          {!!solicitation.atividade && (
            <View style={styles.observationBox}>
              <Text style={styles.infoLabel}>Atividade</Text>
              <Text style={styles.observationText}>
                {solicitation.atividade}
              </Text>
            </View>
          )}

          {!!solicitation.observacoes && (
            <View style={styles.observationBox}>
              <Text style={styles.infoLabel}>Observações</Text>
              <Text style={styles.observationText}>
                {solicitation.observacoes}
              </Text>
            </View>
          )}
        </AppCard>

        {isOverdue && (
          <AppAlert
            variant="error"
            title="Item com devolução em atraso."
            message="Entre em contato com a ferramentaria."
          />
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Recursos solicitados</Text>

          {solicitation.maquinas?.length ? (
            <>
              <Text style={styles.resourceGroupTitle}>Máquinas</Text>

              {solicitation.maquinas.map((machine: any) => (
                <View key={machine.recursoId} style={styles.resourceItem}>
                  <Text style={styles.resourceName}>{machine.nome}</Text>

                  <Text style={styles.resourceMeta}>
                    Máquina
                    {machine.laboratorioNome
                      ? ` • ${machine.laboratorioNome}`
                      : ""}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {solicitation.ferramentas?.length ? (
            <>
              <Text style={styles.resourceGroupTitle}>Ferramentas</Text>

              {solicitation.ferramentas.map((tool: any) => (
                <View key={tool.recursoId} style={styles.resourceItem}>
                  <Text style={styles.resourceName}>{tool.nome}</Text>

                  {!!tool.descricao && (
                    <Text style={styles.resourceMeta}>
                      {tool.descricao}
                    </Text>
                  )}

                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityText}>
                      Solicitada:{" "}
                      <Text style={styles.quantityStrong}>
                        {tool.quantidade}
                      </Text>
                    </Text>

                    {tool.quantidadeDisponivel !== undefined && (
                      <Text style={styles.quantityText}>
                        Disponível:{" "}
                        <Text style={styles.availableStrong}>
                          {tool.quantidadeDisponivel}
                        </Text>
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {!solicitation.maquinas?.length &&
            !solicitation.ferramentas?.length && (
              <EmptyState
                icon="briefcase"
                title="Nenhum recurso solicitado"
                message="Esta solicitação não possui recursos vinculados."
              />
            )}
        </AppCard>

        <View style={styles.buttonContainer}>
          {canCancel && (
            <AppButton
              mode="outlined"
              loading={loading}
              disabled={loading}
              onPress={handleCancelSolicitation}
            >
              Cancelar solicitação
            </AppButton>
          )}

          <AppButton
            mode="outlined"
            onPress={() => navigation.goBack()}
          >
            Voltar
          </AppButton>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}