import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FirebaseError } from "firebase/app";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { EmptyState } from "../../../components/EmptyState";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";

import { Resource } from "../../../types/Resources";
import { getResourceById } from "../../../services/resources/resourceServices";

import {
    createSolicitation,
    updateApprovedSolicitation,
    SolicitationBusinessError,
} from "../../../services/solicitations/solicitationServices";
import { useAuth } from "../../../contexts/AuthContext";

import { styles } from "./styles";
import { colors } from "../../../styles/colors";

type Props = NativeStackScreenProps<
    NovaSolicitacaoStackParamList,
    "ReviewSolicitation"
>;

function getShiftLabel(turno: string) {
    const labels: Record<string, string> = {
        TARDE: "Tarde",
        NOITE: "Noite",
    };

    return labels[turno] ?? turno;
}

export function ReviewSolicitationScreen({ navigation }: Props) {
    const { draft, editingSolicitation, clearDraft } =
        useSolicitationDraft();
    const [laboratories, setLaboratories] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const { appUser } = useAuth();

    const laboratoryIds = useMemo(() => {
        const ids = draft.maquinasSelecionadas
            .map((item) => item.resource.laboratorioId)
            .filter(Boolean) as string[];

        return [...new Set(ids)];
    }, [draft.maquinasSelecionadas]);

    useEffect(() => {
        async function loadLaboratories() {
            if (laboratoryIds.length === 0) {
                setLaboratories([]);
                return;
            }

            const data = await Promise.all(
                laboratoryIds.map((id) => getResourceById(id))
            );

            const validLaboratories = data.filter(Boolean) as Resource[];

            setLaboratories(validLaboratories);
        }

        loadLaboratories();
    }, [laboratoryIds]);

    function handleCancel() {
        Alert.alert(
            editingSolicitation ? "Cancelar edição" : "Cancelar solicitação",
            editingSolicitation
                ? "Deseja cancelar a edição? As alterações não salvas serão perdidas."
                : "Deseja cancelar esta solicitação? Os dados preenchidos serão perdidos.",
            [
                { text: "Continuar editando", style: "cancel" },
                {
                    text: editingSolicitation
                        ? "Cancelar edição"
                        : "Cancelar solicitação",
                    style: "destructive",
                    onPress: () => {
                        clearDraft();
                        navigation.navigate("SolicitationInfo");
                    },
                },
            ]
        );
    }

    async function handleConfirm() {
        if (loading) return;

        const hasResources =
            draft.maquinasSelecionadas.length > 0 ||
            draft.ferramentasSelecionadas.length > 0;

        if (!hasResources) {
            Alert.alert(
                "Selecione um recurso",
                "Adicione pelo menos uma máquina ou ferramenta antes de enviar."
            );
            return;
        }

        try {
            setLoading(true);

            if (!appUser) {
                Alert.alert("Erro", "Usuário não encontrado.");
                return;
            }

            if (editingSolicitation) {
                await updateApprovedSolicitation(
                    editingSolicitation.id,
                    draft,
                    appUser
                );
            } else {
                await createSolicitation(draft, appUser);
            }

            Alert.alert(
                editingSolicitation
                    ? "Solicitação atualizada"
                    : "Solicitação enviada",
                editingSolicitation
                    ? "As alterações foram salvas. Novos recursos ou aumentos serão analisados pela ferramentaria."
                    : "Sua solicitação foi enviada para análise da ferramentaria.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            clearDraft();
                            navigation.navigate("SolicitationInfo");
                        },
                    },
                ]
            );
        } catch (error) {
            console.log("Erro ao criar solicitação:", error);

            const isPermissionError =
                error instanceof FirebaseError &&
                error.code === "permission-denied";

            Alert.alert(
                error instanceof SolicitationBusinessError
                    ? "Solicitação indisponível"
                    : isPermissionError
                    ? "Permissão não configurada"
                    : "Erro ao enviar",
                error instanceof SolicitationBusinessError
                    ? error.message
                    : isPermissionError
                    ? "As regras de auditoria do Firebase ainda não foram publicadas. Atualize as regras do Firestore e tente novamente."
                    : "Não foi possível enviar a solicitação. Tente novamente."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <AppCard>
                    <Text style={styles.sectionTitle}>Informações básicas</Text>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Data de utilização</Text>
                        <Text style={styles.infoValue}>
                            {draft.dataUtilizacao || "Não informado"}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Turno</Text>
                        <Text style={styles.infoValue}>
                            {draft.turno ? getShiftLabel(draft.turno) : "Não informado"}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Atividade</Text>
                        <Text style={styles.infoValue}>
                            {draft.atividade || "Não informado"}
                        </Text>
                    </View>

                    {!!draft.observacoes && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Observações</Text>
                            <Text style={styles.infoValue}>{draft.observacoes}</Text>
                        </View>
                    )}
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>Laboratórios envolvidos</Text>

                    {laboratories.length === 0 ? (
                        <EmptyState
                            icon="map-pin"
                            title="Nenhum laboratório identificado"
                            message="Os laboratórios serão definidos automaticamente pelas máquinas selecionadas."
                        />
                    ) : (
                        laboratories.map((laboratory) => (
                            <View key={laboratory.id} style={styles.listItem}>
                                <Text style={styles.listItemTitle}>{laboratory.nome}</Text>

                                {!!laboratory.localizacao && (
                                    <Text style={styles.listItemSubtitle}>
                                        {laboratory.localizacao}
                                    </Text>
                                )}
                            </View>
                        ))
                    )}
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>Máquinas selecionadas</Text>

                    {draft.maquinasSelecionadas.length === 0 ? (
                        <EmptyState
                            icon="tool"
                            title="Nenhuma máquina selecionada"
                        />
                    ) : (
                        draft.maquinasSelecionadas.map((item) => (
                            <View key={item.resource.id} style={styles.listItem}>
                                <Text style={styles.listItemTitle}>{item.resource.nome}</Text>

                                {!!item.resource.descricao && (
                                    <Text style={styles.listItemSubtitle}>
                                        {item.resource.descricao}
                                    </Text>
                                )}
                            </View>
                        ))
                    )}

                    <AppButton
                        mode="outlined"
                        buttonColor={colors.white}
                        textColor={colors.primary}
                        style={styles.changeButton}
                        onPress={() => navigation.navigate("SelectMachines")}
                    >
                        Alterar máquinas
                    </AppButton>
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>Ferramentas selecionadas</Text>

                    {draft.ferramentasSelecionadas.length === 0 ? (
                        <EmptyState
                            icon="briefcase"
                            title="Nenhuma ferramenta selecionada"
                        />
                    ) : (
                        draft.ferramentasSelecionadas.map((item) => (
                            <View key={item.resource.id} style={styles.listItem}>
                                <Text style={styles.listItemTitle}>
                                    {item.quantidade}x {item.resource.nome}
                                </Text>

                                {!!item.resource.descricao && (
                                    <Text style={styles.listItemSubtitle}>
                                        {item.resource.descricao}
                                    </Text>
                                )}
                            </View>
                        ))
                    )}

                    <AppButton
                        mode="outlined"
                        buttonColor={colors.white}
                        textColor={colors.primary}
                        style={styles.changeButton}
                        onPress={() => navigation.navigate("SelectTools")}
                    >
                        Alterar ferramentas
                    </AppButton>
                </AppCard>

                <View style={styles.buttonContainer}>
                    <AppButton 
                        loading={loading}
                        disabled={loading}
                        onPress={handleConfirm}>
                        {editingSolicitation
                            ? "Salvar alterações"
                            : "Enviar solicitação"}
                    </AppButton>

                    <AppDestructiveButton
                        loading={loading}
                        disabled={loading}
                        onPress={handleCancel}>
                        {editingSolicitation
                            ? "Cancelar edição"
                            : "Cancelar solicitação"}
                    </AppDestructiveButton>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}
