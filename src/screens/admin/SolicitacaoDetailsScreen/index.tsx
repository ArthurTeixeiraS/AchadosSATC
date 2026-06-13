import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { AppAlert } from "../../../components/AppAlert";
import { Loading } from "../../../components/Loading";
import { EmptyState } from "../../../components/EmptyState";
import { AppInput } from "../../../components/AppInput";
import { SolicitationAuditTimeline } from "../../../components/SolicitationAuditTimeline";

import { useAuth } from "../../../contexts/AuthContext";
import { FuncionarioSolicitacaoStackParamList } from "../../../routes/FuncionarioSolicitacaoStackRoutes";

import {
    Alert,
    Modal,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";

import {
    approveSolicitation,
    decideSolicitationChangeItem,
    getSolicitationById,
    isSolicitationOverdue,
    registerSolicitationWithdrawal,
    rejectSolicitation,
    SolicitationBusinessError,
} from "../../../services/solicitations/solicitationServices";
import {
    Solicitation,
    SolicitationChangeMachine,
    SolicitationChangeTool,
} from "../../../types/Solicitation";

import { styles } from "./styles";

type Props = NativeStackScreenProps<
    FuncionarioSolicitacaoStackParamList,
    "FuncionarioSolicitationDetails"
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
    return priority === "IMEDIATA" ? "Imediata" : "Normal";
}

function getTurnoLabel(turno: string) {
    const labels: Record<string, string> = {
        TARDE: "Tarde",
        NOITE: "Noite",
    };

    return labels[turno] ?? turno;
}

function getCode(id: string) {
    return `SL-${id.slice(0, 4).toUpperCase()}`;
}

export function FuncionarioSolicitationDetailsScreen({
    route,
    navigation,
}: Props) {
    const { solicitationId } = route.params;
    const { appUser } = useAuth();

    const [solicitation, setSolicitation] = useState<Solicitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [changeItemToReject, setChangeItemToReject] = useState<{
        type: "MAQUINA" | "FERRAMENTA";
        resourceId: string;
    } | null>(null);
    const [changeRejectReason, setChangeRejectReason] = useState("");
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    async function loadSolicitation() {
        try {
            setLoading(true);

            const data = await getSolicitationById(solicitationId);

            setSolicitation(data);
        } catch (error) {
            console.log("Erro ao buscar solicitação:", error);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadSolicitation();
        }, [solicitationId])
    );

    async function executeAction(action: () => Promise<void>, successMessage: string) {
        if (!appUser || actionLoading) return;

        try {
            setActionLoading(true);

            await action();

            Alert.alert("Sucesso", successMessage, [
                {
                    text: "OK",
                    onPress: loadSolicitation,
                },
            ]);
        } catch (error) {
            console.log("Erro ao executar ação:", error);

            Alert.alert(
                error instanceof SolicitationBusinessError
                    ? "Ação bloqueada"
                    : "Erro",
                error instanceof SolicitationBusinessError
                    ? error.message
                    : "Não foi possível executar esta ação. Tente novamente."
            );
        } finally {
            setActionLoading(false);
        }
    }

    function handleApprove() {
        if (!solicitation || !appUser) return;

        const solicitationId = solicitation.id;
        const employee = appUser;

        Alert.alert(
            "Aprovar solicitação",
            "Deseja aprovar esta solicitação?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aprovar",
                    onPress: () =>
                        executeAction(
                            () =>
                                approveSolicitation(
                                    solicitationId,
                                    employee
                                ),
                            "Solicitação aprovada com sucesso."
                        ),
                },
            ]
        );
    }

    async function handleConfirmReject() {
        if (!solicitation || !appUser) return;

        if (!rejectReason.trim()) {
            Alert.alert("Campo obrigatório", "Informe o motivo da recusa.");
            return;
        }

        setRejectModalVisible(false);

        await executeAction(
            () =>
                rejectSolicitation(
                    solicitation.id,
                    appUser,
                    rejectReason.trim()
                ),
            "Solicitação recusada com sucesso."
        );
    }

    function handleReject() {
        setRejectReason("");
        setRejectModalVisible(true);
    }

    function handleWithdrawal() {
        if (!solicitation || !appUser) return;

        const solicitationId = solicitation.id;
        const employee = appUser;

        Alert.alert(
            "Registrar retirada",
            "Confirma que os itens foram retirados pelo professor?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: () =>
                        executeAction(
                            () =>
                                registerSolicitationWithdrawal(
                                    solicitationId,
                                    employee
                                ),
                            "Retirada registrada com sucesso."
                        ),
                },
            ]
        );
    }

    function handleReturn() {
        if (!solicitation) return;

        navigation.navigate("RegisterSolicitationReturn", {
            solicitationId: solicitation.id,
        });
    }

    function handleApproveChangeItem(
        type: "MAQUINA" | "FERRAMENTA",
        resourceId: string
    ) {
        if (!solicitation || !appUser) return;

        void executeAction(
            () =>
                decideSolicitationChangeItem(
                    solicitation.id,
                    type,
                    resourceId,
                    true,
                    appUser
                ),
            "Item aprovado com sucesso."
        );
    }

    async function handleConfirmChangeRejection() {
        if (
            !solicitation ||
            !appUser ||
            !changeItemToReject
        ) {
            return;
        }

        if (!changeRejectReason.trim()) {
            Alert.alert("Campo obrigatório", "Informe o motivo da recusa.");
            return;
        }

        const selectedItem = changeItemToReject;
        setChangeItemToReject(null);

        await executeAction(
            () =>
                decideSolicitationChangeItem(
                    solicitation.id,
                    selectedItem.type,
                    selectedItem.resourceId,
                    false,
                    appUser,
                    changeRejectReason.trim()
                ),
            "Item recusado com sucesso."
        );
    }

    function renderChangeItem(
        item: SolicitationChangeMachine | SolicitationChangeTool,
        type: "MAQUINA" | "FERRAMENTA"
    ) {
        const isPending = item.status === "PENDENTE";
        const quantity =
            type === "FERRAMENTA"
                ? (item as SolicitationChangeTool).quantidadeAdicional
                : 1;

        return (
            <View
                key={`${type}-${item.recursoId}`}
                style={styles.changeItem}
            >
                <View style={styles.changeItemHeader}>
                    <View style={styles.changeItemInfo}>
                        <Text style={styles.resourceName}>{item.nome}</Text>
                        <Text style={styles.resourceMeta}>
                            {type === "MAQUINA"
                                ? "Nova máquina"
                                : `Aumento de ${quantity} unidade(s)`}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.changeStatus,
                            item.status === "APROVADO"
                                ? styles.changeStatusApproved
                                : item.status === "RECUSADO"
                                ? styles.changeStatusRejected
                                : styles.changeStatusPending,
                        ]}
                    >
                        {item.status === "APROVADO"
                            ? "Aprovado"
                            : item.status === "RECUSADO"
                            ? "Recusado"
                            : "Pendente"}
                    </Text>
                </View>

                {!!item.decisao?.motivo && (
                    <Text style={styles.resourceMeta}>
                        Motivo: {item.decisao.motivo}
                    </Text>
                )}

                {isPending && (
                    <View style={styles.actionRow}>
                        <AppButton
                            disabled={actionLoading}
                            onPress={() =>
                                handleApproveChangeItem(
                                    type,
                                    item.recursoId
                                )
                            }
                            style={styles.actionButton}
                        >
                            Aprovar
                        </AppButton>

                        <AppDestructiveButton
                            disabled={actionLoading}
                            onPress={() => {
                                setChangeRejectReason("");
                                setChangeItemToReject({
                                    type,
                                    resourceId: item.recursoId,
                                });
                            }}
                            style={styles.actionButton}
                        >
                            Recusar
                        </AppDestructiveButton>
                    </View>
                )}
            </View>
        );
    }

    if (loading) {
        return <Loading message="Carregando solicitação..." />;
    }

    if (!solicitation) {
        return (
            <ScreenContainer>
                <EmptyState
                    icon="file-text"
                    title="Solicitação não encontrada"
                    message="Não foi possível carregar os detalhes."
                />
            </ScreenContainer>
        );
    }

    const canApproveOrReject = solicitation.status === "PENDENTE";
    const canRegisterWithdrawal = solicitation.status === "APROVADA";
    const canRegisterReturn = solicitation.status === "EM_USO";
    const isChangePending = solicitation.status === "ALTERACAO_PENDENTE";
    const showReturnProgress = ["EM_USO", "ENCERRADA"].includes(
        solicitation.status
    );
    const pendingChangeItemsCount = solicitation.analiseAlteracao
        ? [
              ...solicitation.analiseAlteracao.maquinas,
              ...solicitation.analiseAlteracao.ferramentas,
          ].filter((item) => item.status === "PENDENTE").length
        : 0;

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <AppCard>
                    <Text style={styles.code}>{getCode(solicitation.id)}</Text>

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
                                {solicitation.dataUtilizacao}
                            </Text>
                        </View>

                        <View style={styles.infoColumn}>
                            <Text style={styles.infoLabel}>Turno</Text>
                            <Text style={styles.infoValue}>
                                {getTurnoLabel(solicitation.turno)}
                            </Text>
                        </View>

                        <View style={styles.infoColumn}>
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    isChangePending &&
                                        styles.changePendingStatusValue,
                                ]}
                            >
                                {getStatusLabel(solicitation.status)}
                            </Text>
                        </View>

                        <View style={styles.infoColumn}>
                            <Text style={styles.infoLabel}>Prioridade</Text>
                            <Text style={styles.infoValue}>
                                {getPriorityLabel(solicitation.prioridade)}
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

                {isChangePending && !!solicitation.analiseAlteracao && (
                    <AppCard style={styles.changeReviewCard}>
                        <Text style={styles.sectionTitle}>
                            Reaprovar itens da alteração
                        </Text>

                        <AppAlert
                            variant="info"
                            title={`${pendingChangeItemsCount} acréscimo${
                                pendingChangeItemsCount !== 1 ? "s" : ""
                            } aguardando decisão`}
                            message="Os recursos aprovados anteriormente continuam reservados. Aprove ou recuse separadamente cada acréscimo abaixo."
                        />

                        {solicitation.analiseAlteracao.maquinas.map((item) =>
                            renderChangeItem(item, "MAQUINA")
                        )}

                        {solicitation.analiseAlteracao.ferramentas.map((item) =>
                            renderChangeItem(item, "FERRAMENTA")
                        )}
                    </AppCard>
                )}

                {isSolicitationOverdue(solicitation, currentTime) && (
                    <AppAlert
                        variant="error"
                        title="Item com devolução em atraso."
                        message="Entre em contato com o professor responsável."
                    />
                )}

                <AppCard>
                    <Text style={styles.sectionTitle}>Recursos solicitados</Text>

                    {!!solicitation.maquinas?.length && (
                        <>
                            <Text style={styles.resourceGroupTitle}>Máquinas</Text>

                            {solicitation.maquinas.map((machine) => (
                                <View key={machine.recursoId} style={styles.resourceItem}>
                                    <Text style={styles.resourceName}>{machine.nome}</Text>

                                    {!!solicitation.analiseAlteracao && (
                                        <Text style={styles.approvedItemStatus}>
                                            Aprovado
                                        </Text>
                                    )}

                                    <Text style={styles.resourceMeta}>
                                        Laboratório:{" "}
                                        {machine.laboratorioNome ??
                                            machine.laboratorioId ??
                                            "Não informado"}
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
                    )}

                    {!!solicitation.ferramentas?.length && (
                        <>
                            <Text style={styles.resourceGroupTitle}>Ferramentas</Text>

                            {solicitation.ferramentas.map((tool) => (
                                <View key={tool.recursoId} style={styles.resourceItem}>
                                    <Text style={styles.resourceName}>{tool.nome}</Text>

                                    {!!solicitation.analiseAlteracao && (
                                        <Text style={styles.approvedItemStatus}>
                                            Aprovado
                                        </Text>
                                    )}

                                    <View style={styles.quantityRow}>
                                        <Text style={styles.quantityText}>
                                            Solicitada:{" "}
                                            <Text style={styles.quantityStrong}>
                                                {tool.quantidade}
                                            </Text>
                                        </Text>

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
                                                                Number(
                                                                    tool.quantidadeDevolvida ??
                                                                        0
                                                                ),
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
                    )}
                </AppCard>

                {!!solicitation.analiseAlteracao && !isChangePending && (
                    <AppCard>
                        <Text style={styles.sectionTitle}>
                            Resultado da alteração
                        </Text>

                        <AppAlert
                            variant="info"
                            message="Todos os acréscimos desta alteração já foram analisados."
                        />

                        {solicitation.analiseAlteracao.maquinas.map((item) =>
                            renderChangeItem(item, "MAQUINA")
                        )}

                        {solicitation.analiseAlteracao.ferramentas.map((item) =>
                            renderChangeItem(item, "FERRAMENTA")
                        )}
                    </AppCard>
                )}

                <SolicitationAuditTimeline solicitation={solicitation} />

                <View style={styles.buttonContainer}>
                    {canApproveOrReject && (
                        <View style={styles.actionRow}>
                            <AppButton
                                disabled={actionLoading}
                                loading={actionLoading}
                                onPress={handleApprove}
                                style={styles.actionButton}
                            >
                                Aprovar
                            </AppButton>

                            <AppDestructiveButton
                                disabled={actionLoading}
                                onPress={handleReject}
                                style={styles.actionButton}
                            >
                                Recusar
                            </AppDestructiveButton>
                        </View>
                    )}

                    {canRegisterWithdrawal && (
                        <AppButton
                            loading={actionLoading}
                            disabled={actionLoading}
                            onPress={handleWithdrawal}
                        >
                            Registrar retirada
                        </AppButton>
                    )}

                    {canRegisterReturn && (
                        <AppButton
                            loading={actionLoading}
                            disabled={actionLoading}
                            onPress={handleReturn}
                        >
                            Registrar devolução de recursos
                        </AppButton>
                    )}

                </View>
            </ScrollView>
            <Modal
                visible={rejectModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Recusar solicitação</Text>

                        <Text style={styles.modalDescription}>
                            Informe o motivo da recusa para que o professor saiba o que aconteceu.
                        </Text>

                        <AppInput
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="Motivo da recusa"
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <AppDestructiveButton
                                disabled={actionLoading}
                                loading={actionLoading}
                                onPress={handleConfirmReject}
                            >
                                Confirmar recusa
                            </AppDestructiveButton>

                            <AppButton
                                mode="outlined"
                                disabled={actionLoading}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                Cancelar
                            </AppButton>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={!!changeItemToReject}
                transparent
                animationType="fade"
                onRequestClose={() => setChangeItemToReject(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Recusar item da alteração
                        </Text>

                        <Text style={styles.modalDescription}>
                            Informe o motivo para que o professor compreenda a decisão.
                        </Text>

                        <AppInput
                            value={changeRejectReason}
                            onChangeText={setChangeRejectReason}
                            placeholder="Motivo da recusa"
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <AppDestructiveButton
                                disabled={actionLoading}
                                loading={actionLoading}
                                onPress={handleConfirmChangeRejection}
                            >
                                Confirmar recusa
                            </AppDestructiveButton>

                            <AppButton
                                mode="outlined"
                                disabled={actionLoading}
                                onPress={() => setChangeItemToReject(null)}
                            >
                                Cancelar
                            </AppButton>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}
