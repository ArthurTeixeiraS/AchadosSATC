import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { EmptyState } from "../../../components/EmptyState";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";

import { Resource } from "../../../types/Resources";
import { getResourceById } from "../../../services/resources/resourceServices";

import { createSolicitation } from "../../../services/solicitations/solicitationServices";
import { useAuth } from "../../../contexts/AuthContext";

import { styles } from "./styles";

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
    const { draft, clearDraft } = useSolicitationDraft();
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
            "Cancelar solicitação",
            "Deseja cancelar esta solicitação? Os dados preenchidos serão perdidos.",
            [
                { text: "Continuar editando", style: "cancel" },
                {
                    text: "Cancelar solicitação",
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

        try {
            setLoading(true);

            if (!appUser) {
                Alert.alert("Erro", "Usuário não encontrado.");
                return;
            }

            await createSolicitation(draft, appUser);

            Alert.alert(
                "Solicitação enviada",
                "Sua solicitação foi enviada para análise da ferramentaria.",
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

            Alert.alert(
                "Erro ao enviar",
                "Não foi possível enviar a solicitação. Tente novamente."
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
                <PageTitle
                    title="Revisar solicitação"
                    subtitle="Confira os dados antes de enviar para aprovação."
                />

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
                            message="Volte para selecionar as máquinas necessárias."
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
                            message="Você pode enviar a solicitação apenas com máquinas."
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
                        Enviar solicitação
                    </AppButton>

                    <AppButton 
                        loading={loading}
                        disabled={loading}
                        mode="outlined" 
                        onPress={handleCancel}>
                        Cancelar solicitação
                    </AppButton>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}