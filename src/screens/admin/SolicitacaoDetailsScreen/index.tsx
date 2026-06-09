import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppAlert } from "../../../components/AppAlert";
import { Loading } from "../../../components/Loading";
import { EmptyState } from "../../../components/EmptyState";
import { AppInput } from "../../../components/AppInput";

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
    getSolicitationById,
    isSolicitationOverdue,
    registerSolicitationReturn,
    registerSolicitationWithdrawal,
    rejectSolicitation,
    SolicitationBusinessError,
} from "../../../services/solicitations/solicitationServices";
import { Solicitation } from "../../../types/Solicitation";

import { styles } from "./styles";

type Props = NativeStackScreenProps<
    FuncionarioSolicitacaoStackParamList,
    "FuncionarioSolicitationDetails"
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
                                    employee.id,
                                    employee.nomeCompleto
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
                    appUser.id,
                    appUser.nomeCompleto,
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
                                    employee.id,
                                    employee.nomeCompleto
                                ),
                            "Retirada registrada com sucesso."
                        ),
                },
            ]
        );
    }

    function handleReturn() {
        if (!solicitation || !appUser) return;

        const solicitationId = solicitation.id;
        const employee = appUser;

        Alert.alert(
            "Registrar devolução",
            "Confirma que os itens foram devolvidos?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: () =>
                        executeAction(
                            () =>
                                registerSolicitationReturn(
                                    solicitationId,
                                    employee.id,
                                    employee.nomeCompleto
                                ),
                            "Devolução registrada com sucesso."
                        ),
                },
            ]
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
                            <Text style={styles.statusValue}>
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

                                    <Text style={styles.resourceMeta}>
                                        Laboratório:{" "}
                                        {machine.laboratorioNome ??
                                            machine.laboratorioId ??
                                            "Não informado"}
                                    </Text>
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

                                    <View style={styles.quantityRow}>
                                        <Text style={styles.quantityText}>
                                            Solicitada:{" "}
                                            <Text style={styles.quantityStrong}>
                                                {tool.quantidade}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </AppCard>

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

                            <AppButton
                                mode="contained"
                                disabled={actionLoading}
                                buttonColor="#991B1B"
                                onPress={handleReject}
                                style={styles.actionButton}
                            >
                                Recusar
                            </AppButton>
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
                            Registrar devolução
                        </AppButton>
                    )}

                    <AppButton
                        mode="outlined"
                        disabled={actionLoading}
                        onPress={() => navigation.goBack()}
                    >
                        Voltar
                    </AppButton>
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
                            <AppButton
                                mode="outlined"
                                disabled={actionLoading}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                Cancelar
                            </AppButton>

                            <AppButton
                                disabled={actionLoading}
                                loading={actionLoading}
                                buttonColor="#991B1B"
                                onPress={handleConfirmReject}
                            >
                                Confirmar recusa
                            </AppButton>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}
