import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { AppAlert } from "../../../components/AppAlert";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { SolicitationAuditTimeline } from "../../../components/SolicitationAuditTimeline";
import { getResourceById } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";
import {
  cancelSolicitation,
  getSolicitationById,
  isSolicitationOverdue,
} from "../../../services/solicitations/solicitationServices";

import { MinhasSolicitacoesStackParamList } from "../../../routes/MinhasSolicitacoesStackRoutes";
import type { ProfessorDrawerParamList } from "../../../routes/ProfessorRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  Solicitation,
  SolicitationDraft,
} from "../../../types/Solicitation";

import { styles } from "./styles";

type Props = NativeStackScreenProps<
  MinhasSolicitacoesStackParamList,
  "ProfessorSolicitationDetails"
>;

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
  const { solicitationId } = route.params;
  const { appUser } = useAuth();
  const { draft, replaceDraft, startEditing } = useSolicitationDraft();

  const [solicitation, setSolicitation] = useState<Solicitation | null>(null);
  const [loadingSolicitation, setLoadingSolicitation] = useState(true);
  const [laboratoryNames, setLaboratoryNames] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const loadSolicitation = useCallback(async () => {
    try {
      setLoadingSolicitation(true);
      setSolicitation(await getSolicitationById(solicitationId));
    } catch (error) {
      console.log("Erro ao carregar solicitação:", error);
      setSolicitation(null);
    } finally {
      setLoadingSolicitation(false);
    }
  }, [solicitationId]);

  useFocusEffect(
    useCallback(() => {
      void loadSolicitation();
    }, [loadSolicitation])
  );

  useEffect(() => {
    async function loadLaboratories() {
      if (!solicitation) {
        setLaboratoryNames([]);
        return;
      }

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
  }, [solicitation?.laboratoriosIds]);

  function handleCancelSolicitation() {
    if (!solicitation) return;

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
              setActionLoading(true);

              if (!appUser) {
                throw new Error("Usuário não encontrado.");
              }

              await cancelSolicitation(solicitation.id, appUser);

              Alert.alert(
                "Solicitação cancelada",
                "Sua solicitação foi cancelada com sucesso.",
                [
                  {
                    text: "OK",
                    onPress: () =>
                      navigation.navigate("MinhasSolicitacoesList"),
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
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  function hasExistingDraft() {
    return (
      !!draft.dataUtilizacao ||
      !!draft.turno ||
      !!draft.atividade ||
      !!draft.observacoes ||
      draft.maquinasSelecionadas.length > 0 ||
      draft.ferramentasSelecionadas.length > 0
    );
  }

  async function duplicateSolicitation() {
    if (duplicating || !solicitation) return;

    try {
      setDuplicating(true);

      const [machines, tools] = await Promise.all([
        Promise.all(
          (solicitation.maquinas ?? []).map(async (machine) => ({
            snapshot: machine,
            resource: await getResourceById(machine.recursoId),
          }))
        ),
        Promise.all(
          (solicitation.ferramentas ?? []).map(async (tool) => ({
            snapshot: tool,
            resource: await getResourceById(tool.recursoId),
          }))
        ),
      ]);

      const invalidResources: string[] = [];
      const resourcesToReview: string[] = [];

      const selectedMachines = machines.flatMap(({ snapshot, resource }) => {
        if (!resource || resource.tipo !== "MAQUINA") {
          invalidResources.push(snapshot.nome);
          return [];
        }

        if (resource.status !== "DISPONIVEL") {
          resourcesToReview.push(snapshot.nome);
        }

        return [{ resource }];
      });

      const selectedTools = tools.flatMap(({ snapshot, resource }) => {
        if (!resource || resource.tipo !== "FERRAMENTA") {
          invalidResources.push(snapshot.nome);
          return [];
        }

        const quantidade = Math.max(1, Number(snapshot.quantidade) || 1);

        if (resource.status !== "DISPONIVEL") {
          resourcesToReview.push(snapshot.nome);
        }

        return [{ resource, quantidade }];
      });

      const duplicatedDraft: SolicitationDraft = {
        dataUtilizacao: "",
        turno: solicitation.turno,
        atividade: solicitation.atividade ?? "",
        observacoes: solicitation.observacoes ?? "",
        maquinasSelecionadas: selectedMachines,
        ferramentasSelecionadas: selectedTools,
      };

      replaceDraft(duplicatedDraft, {
        flowMode: "DUPLICATE",
        sourceSolicitationId: solicitation.id,
      });

      const drawerNavigation =
        navigation.getParent<DrawerNavigationProp<ProfessorDrawerParamList>>();

      drawerNavigation?.navigate("Nova Solicitação", {
        screen: "SolicitationInfo",
      });

      const warnings = [
        invalidResources.length
          ? `Não encontrados: ${invalidResources.join(", ")}.`
          : "",
        resourcesToReview.length
          ? `Precisam ser revisados: ${resourcesToReview.join(", ")}.`
          : "",
      ].filter(Boolean);

      if (warnings.length) {
        Alert.alert(
          "Revise os recursos",
          `O rascunho foi criado, mas alguns recursos mudaram desde a solicitação original.\n\n${warnings.join("\n")}`
        );
      }
    } catch (error) {
      console.log("Erro ao duplicar solicitação:", error);

      Alert.alert(
        "Erro ao duplicar",
        "Não foi possível preparar a nova solicitação. Tente novamente."
      );
    } finally {
      setDuplicating(false);
    }
  }

  function handleDuplicateSolicitation() {
    if (!hasExistingDraft()) {
      void duplicateSolicitation();
      return;
    }

    Alert.alert(
      "Substituir rascunho?",
      "Já existe uma solicitação em preenchimento. Ao continuar, os dados atuais serão substituídos.",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Substituir",
          style: "destructive",
          onPress: () => void duplicateSolicitation(),
        },
      ]
    );
  }

  async function editSolicitation() {
    if (duplicating || !solicitation) return;

    try {
      setDuplicating(true);

      const [machines, tools] = await Promise.all([
        Promise.all(
          (solicitation.maquinas ?? []).map(async (machine) => ({
            snapshot: machine,
            resource: await getResourceById(machine.recursoId),
          }))
        ),
        Promise.all(
          (solicitation.ferramentas ?? []).map(async (tool) => ({
            snapshot: tool,
            resource: await getResourceById(tool.recursoId),
          }))
        ),
      ]);
      const missingResources = [
        ...machines
          .filter(({ resource }) => !resource)
          .map(({ snapshot }) => snapshot.nome),
        ...tools
          .filter(({ resource }) => !resource)
          .map(({ snapshot }) => snapshot.nome),
      ];

      if (missingResources.length > 0) {
        Alert.alert(
          "Recursos não encontrados",
          `Não foi possível editar porque alguns recursos não existem mais: ${missingResources.join(", ")}.`
        );
        return;
      }

      const editDraft: SolicitationDraft = {
        dataUtilizacao: solicitation.dataUtilizacao,
        turno: solicitation.turno,
        atividade: solicitation.atividade ?? "",
        observacoes: solicitation.observacoes ?? "",
        maquinasSelecionadas: machines.map(({ resource }) => ({
          resource: resource as Resource,
        })),
        ferramentasSelecionadas: tools.map(({ snapshot, resource }) => ({
          resource: resource as Resource,
          quantidade: Number(snapshot.quantidade) || 1,
        })),
      };

      startEditing(solicitation, editDraft);

      navigation
        .getParent<DrawerNavigationProp<ProfessorDrawerParamList>>()
        ?.navigate("Nova Solicitação", {
          screen: "SolicitationInfo",
        });
    } catch (error) {
      console.log("Erro ao preparar edição da solicitação:", error);
      Alert.alert(
        "Erro ao editar",
        "Não foi possível preparar a solicitação para edição."
      );
    } finally {
      setDuplicating(false);
    }
  }

  function handleEditSolicitation() {
    if (!hasExistingDraft()) {
      void editSolicitation();
      return;
    }

    Alert.alert(
      "Substituir rascunho?",
      "Já existe uma solicitação em preenchimento. Ao continuar, os dados atuais serão substituídos.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Substituir",
          style: "destructive",
          onPress: () => void editSolicitation(),
        },
      ]
    );
  }

  if (loadingSolicitation) {
    return <Loading message="Carregando solicitação..." />;
  }

  if (!solicitation) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="file-text"
          title="Solicitação não encontrada"
          message="Não foi possível carregar os detalhes desta solicitação."
        />
      </ScreenContainer>
    );
  }

  const canCancel = solicitation.status === "PENDENTE";
  const showReturnProgress = ["EM_USO", "ENCERRADA"].includes(
    solicitation.status
  );

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

        {isSolicitationOverdue(solicitation, currentTime) && (
          <View style={styles.overdueAlertContainer}>
            <AppAlert
              variant="error"
              title="Item com devolução em atraso."
              message="Entre em contato com a ferramentaria."
            />
          </View>
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Recursos solicitados</Text>

          {solicitation.maquinas?.length ? (
            <>
              <Text style={styles.resourceGroupTitle}>Máquinas</Text>

              {solicitation.maquinas.map((machine: any) => (
                <View key={machine.recursoId} style={styles.resourceItem}>
                  <Text style={styles.resourceName}>{machine.nome}</Text>

                  {!!solicitation.analiseAlteracao && (
                    <Text style={styles.approvedItemStatus}>Aprovado</Text>
                  )}

                  <Text style={styles.resourceMeta}>
                    Máquina
                    {machine.laboratorioNome
                      ? ` • ${machine.laboratorioNome}`
                      : ""}
                  </Text>

                  {showReturnProgress && (
                    <Text
                      style={[
                        styles.returnStatus,
                        machine.devolvida
                          ? styles.returnedStatus
                          : styles.pendingStatus,
                      ]}
                    >
                      {machine.devolvida
                        ? "Devolvida"
                        : "Pendente de devolução"}
                    </Text>
                  )}
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

                  {!!solicitation.analiseAlteracao && (
                    <Text style={styles.approvedItemStatus}>Aprovado</Text>
                  )}

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

                    {showReturnProgress && (
                      <>
                        <Text style={styles.quantityText}>
                          Devolvida:{" "}
                          <Text style={styles.quantityStrong}>
                            {tool.quantidadeDevolvida ?? 0}
                          </Text>
                        </Text>

                        <Text style={styles.quantityText}>
                          Pendente:{" "}
                          <Text style={styles.quantityStrong}>
                            {Math.max(
                              Number(tool.quantidade) -
                                Number(tool.quantidadeDevolvida ?? 0),
                              0
                            )}
                          </Text>
                        </Text>
                      </>
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

        {!!solicitation.analiseAlteracao && (
          <AppCard>
            <Text style={styles.sectionTitle}>Alteração solicitada</Text>

            <AppAlert
              variant={
                solicitation.status === "ALTERACAO_PENDENTE"
                  ? "info"
                  : "success"
              }
              message={
                solicitation.status === "ALTERACAO_PENDENTE"
                  ? "Os recursos aprovados continuam reservados enquanto os acréscimos são analisados."
                  : "A análise desta alteração foi concluída."
              }
            />

            {[
              ...solicitation.analiseAlteracao.maquinas.map((item) => ({
                key: `MAQUINA-${item.recursoId}`,
                name: item.nome,
                detail: "Nova máquina",
                status: item.status,
                reason: item.decisao?.motivo,
              })),
              ...solicitation.analiseAlteracao.ferramentas.map((item) => ({
                key: `FERRAMENTA-${item.recursoId}`,
                name: item.nome,
                detail: `Aumento de ${item.quantidadeAdicional} unidade(s)`,
                status: item.status,
                reason: item.decisao?.motivo,
              })),
            ].map((item) => (
              <View key={item.key} style={styles.resourceItem}>
                <Text style={styles.resourceName}>{item.name}</Text>
                <Text style={styles.resourceMeta}>
                  {item.detail} ·{" "}
                  {item.status === "APROVADO"
                    ? "Aprovado"
                    : item.status === "RECUSADO"
                    ? "Recusado"
                    : "Pendente"}
                </Text>

                {!!item.reason && (
                  <Text style={styles.resourceMeta}>
                    Motivo: {item.reason}
                  </Text>
                )}
              </View>
            ))}
          </AppCard>
        )}

        <SolicitationAuditTimeline solicitation={solicitation} />

        <View style={styles.buttonContainer}>
          {solicitation.status === "APROVADA" && (
            <AppButton
              loading={duplicating}
              disabled={actionLoading || duplicating}
              onPress={handleEditSolicitation}
            >
              Editar solicitação
            </AppButton>
          )}

          <AppButton
            loading={duplicating}
            disabled={actionLoading || duplicating}
            onPress={handleDuplicateSolicitation}
          >
            Duplicar solicitação
          </AppButton>

          {canCancel && (
            <AppDestructiveButton
              loading={actionLoading}
              disabled={actionLoading || duplicating}
              onPress={handleCancelSolicitation}
            >
              Cancelar solicitação
            </AppDestructiveButton>
          )}

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
