import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Image, ScrollView, View, Alert, FlatList } from "react-native";
import { Text, Portal, Modal, Button as PaperButton } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { Loading } from "../../../components/Loading";

import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { colors } from "../../../styles/colors";
import { spacing } from "../../../styles/spacing";
import { radius } from "../../../styles/radius";
import { typography } from "../../../styles/typography";

import { styles } from "./styles";

import { getResourceById, archiveResource, unarchiveResource, checkBlockingSolicitations } from "../../../services/resources/resourceServices";
import { useAuth } from "../../../contexts/AuthContext";

type Props = NativeStackScreenProps<
    ResourceStackParamList,
    "ResourceDetails"
>;

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        DISPONIVEL: "Disponível",
        EM_USO: "Em uso",
        MANUTENCAO: "Manutenção",
    };

    return labels[status] ?? status;
}

function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
        FERRAMENTA: "Ferramenta",
        MAQUINA: "Máquina",
        LABORATORIO: "Laboratório",
    };

    return labels[type] ?? type;
}

export function ResourceDetailsScreen({ route, navigation }: Props) {
    const { resource: initialResource } = route.params;
    const { appUser } = useAuth();
    const [resource, setResource] = useState(initialResource);

    const isFerramenta = resource.tipo === "FERRAMENTA";
    const isMaquina = resource.tipo === "MAQUINA";
    const isLaboratorio = resource.tipo === "LABORATORIO";

    const [laboratoryName, setLaboratoryName] = useState("");
    const [isBlockingModalVisible, setBlockingModalVisible] = React.useState(false);
    const [blockingSolicitations, setBlockingSolicitations] = React.useState<any[]>([]);
    const [isChecking, setIsChecking] = React.useState(false);

    useFocusEffect(
        useCallback(() => {
            async function reloadResource() {
                const updatedResource = await getResourceById(initialResource.id);

                if (updatedResource) {
                    setResource(updatedResource);

                    if (
                        updatedResource.tipo === "MAQUINA" &&
                        updatedResource.laboratorioId
                    ) {
                        const laboratory = await getResourceById(updatedResource.laboratorioId);
                        setLaboratoryName(laboratory?.nome ?? "");
                    }
                }
            }

            reloadResource();
        }, [initialResource.id])
    );

    useEffect(() => {
        async function loadLaboratory() {
            if (
                resource.tipo !== "MAQUINA" ||
                !resource.laboratorioId
            ) {
                return;
            }

            const laboratory = await getResourceById(
                resource.laboratorioId
            );

            if (laboratory) {
                setLaboratoryName(laboratory.nome);
            }
        }

        loadLaboratory();
    }, []);

    async function handleArchiveResource() {
        try {
            setIsChecking(true);
            const blocking = await checkBlockingSolicitations(resource.id);
            setIsChecking(false);

            if (blocking.length > 0) {
                setBlockingSolicitations(blocking);
                setBlockingModalVisible(true);
                return;
            }

            Alert.alert(
                "Arquivar recurso",
                "Tem certeza que deseja arquivar este recurso? Ele não estará mais disponível para novas solicitações e listagens padrão.",
                [
                    {
                        text: "Cancelar",
                        style: "cancel",
                    },
                    {
                        text: "Arquivar",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                if (!appUser) {
                                    Alert.alert(
                                        "Erro ao arquivar",
                                        "Não foi possível identificar o usuário responsável."
                                    );
                                    return;
                                }

                                await archiveResource(resource.id, appUser);
                                navigation.navigate("ResourceList");
                            } catch (error: any) {
                                console.log("Erro ao arquivar recurso:", error);
                                Alert.alert(
                                    "Erro ao arquivar",
                                    error.message || "Não foi possível arquivar o recurso. Tente novamente."
                                );
                            }
                        },
                    },
                ]
            );
        } catch (error: any) {
            setIsChecking(false);
            Alert.alert("Erro", "Não foi possível verificar a disponibilidade do recurso.");
        }
    }

    function handleUnarchiveResource() {
        Alert.alert(
            "Desarquivar recurso",
            "Tem certeza que deseja desarquivar este recurso? Ele voltará a estar disponível para novas solicitações.",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Desarquivar",
                    style: "default",
                    onPress: async () => {
                        try {
                            if (!appUser) {
                                Alert.alert(
                                    "Erro ao desarquivar",
                                    "Não foi possível identificar o usuário responsável."
                                );
                                return;
                            }

                            await unarchiveResource(resource.id, appUser);
                            navigation.navigate("ResourceList");
                        } catch (error: any) {
                            console.log("Erro ao desarquivar recurso:", error);
                            Alert.alert(
                                "Erro ao desarquivar",
                                error.message || "Não foi possível desarquivar o recurso. Tente novamente."
                            );
                        }
                    },
                },
            ]
        );
    }

    return (
        <ScreenContainer>
            <ScrollView showsVerticalScrollIndicator={false}>
                <PageTitle
                    title={resource.nome}
                    subtitle="Detalhes completos do recurso"
                />

                {isFerramenta && resource.imagemUrl && (
                    <Image
                        source={{ uri: resource.imagemUrl }}
                        style={styles.image}
                    />
                )}

                <AppCard>
                    <Text style={styles.sectionTitle}>Informações gerais</Text>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Nome</Text>
                        <Text style={styles.infoValue}>{resource.nome}</Text>
                    </View>

                    {resource.descricao && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Descrição</Text>
                            <Text style={styles.infoValue}>{resource.descricao}</Text>
                        </View>
                    )}

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Tipo</Text>
                        <Text style={styles.infoValue}>{getTypeLabel(resource.tipo)}</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={styles.statusText}>
                            {getStatusLabel(resource.status)}
                        </Text>
                    </View>

                    {resource.isArchived && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Situação</Text>
                            <Text style={[styles.statusText, { color: colors.error }]}>
                                ARQUIVADO
                            </Text>
                        </View>
                    )}
                </AppCard>

                {isFerramenta && (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Estoque</Text>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Quantidade total</Text>
                            <Text style={styles.infoValue}>
                                {resource.quantidadeTotal ?? "Não informado"}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Quantidade disponível</Text>
                            <Text style={styles.infoValue}>
                                {resource.quantidadeDisponivel ?? "Não informado"}
                            </Text>
                        </View>
                    </AppCard>
                )}

                {isMaquina && (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Dados da máquina</Text>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Patrimônio</Text>
                            <Text style={styles.infoValue}>
                                {resource.patrimonio || "Não informado"}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Laboratório vinculado</Text>
                            <Text style={styles.infoValue}>
                                {laboratoryName || "Não informado, corrigir com urgência"}
                            </Text>
                        </View>
                    </AppCard>
                )}

                {isLaboratorio && (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Dados do laboratório</Text>

                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Localização</Text>
                            <Text style={styles.infoValue}>
                                {resource.localizacao || "Não informado"}
                            </Text>
                        </View>
                    </AppCard>
                )}

                <AppCard>
                    <Text style={styles.sectionTitle}>Ações</Text>

                    <AppButton
                        icon="pencil"
                        onPress={() =>
                            navigation.navigate("EditResource", {
                                resource,
                                returnOrigin: route.params.origin,
                            })
                        }
                    >
                        Editar recurso
                    </AppButton>

                    <AppButton
                        mode="outlined"
                        icon="content-copy"
                        onPress={() =>
                            navigation.navigate("CreateResource", {
                                duplicateFrom: resource,
                                initialType: resource.tipo,
                                duplicateOrigin: "DETAILS",
                                returnOrigin: route.params.origin,
                            })
                        }
                    >
                        Duplicar recurso
                    </AppButton>

                    {!resource.isArchived && (
                        <AppDestructiveButton
                            icon={() => (
                                <Feather name="archive" size={18} color={colors.error} />
                            )}
                            onPress={handleArchiveResource}
                        >
                            Arquivar recurso
                        </AppDestructiveButton>
                    )}

                    {resource.isArchived && (
                        <AppButton
                            icon={() => (
                                <Feather name="package" size={18} color={colors.primary} />
                            )}
                            mode="outlined"
                            onPress={handleUnarchiveResource}
                        >
                            Desarquivar recurso
                        </AppButton>
                    )}
                </AppCard>
            </ScrollView>

            <Portal>
                <Modal
                    visible={isBlockingModalVisible}
                    onDismiss={() => setBlockingModalVisible(false)}
                    contentContainerStyle={{
                        backgroundColor: colors.surface,
                        padding: spacing.lg,
                        marginHorizontal: spacing.lg,
                        borderRadius: radius.lg,
                        maxHeight: "80%",
                    }}
                >
                    <View style={{ alignItems: "center", marginBottom: spacing.md }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
                            <Feather name="alert-triangle" size={24} color={colors.error} />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: typography.fontFamily.bold, color: colors.text, textAlign: "center" }}>
                            Arquivamento Bloqueado
                        </Text>
                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.regular, color: colors.textSecondary, textAlign: "center", marginTop: 4 }}>
                            Este recurso não pode ser arquivado no momento, pois está vinculado às seguintes solicitações ativas:
                        </Text>
                    </View>

                    <FlatList
                        data={blockingSolicitations}
                        keyExtractor={(item) => item.id}
                        style={{ flexGrow: 0, marginVertical: spacing.md, maxHeight: 160 }}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="black"
                        renderItem={({ item }) => (
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                    <Feather name="file-text" size={20} color={colors.textSecondary} />
                                    <View>
                                        <Text style={{ fontSize: 14, fontFamily: typography.fontFamily.semiBold, color: colors.text }}>
                                            Ordem #{item.id.substring(0, 6).toUpperCase()}
                                        </Text>
                                        <Text style={{ fontSize: 12, fontFamily: typography.fontFamily.medium, color: colors.textSecondary }}>
                                            Prof. {item.professorNome?.split(" ")[0] || "Desconhecido"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 10, fontFamily: typography.fontFamily.bold, color: colors.primary }}>
                                        {item.status.replace("_", " ")}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />

                    <PaperButton
                        mode="contained"
                        onPress={() => setBlockingModalVisible(false)}
                        buttonColor={colors.primary}
                        style={{ marginTop: spacing.sm, borderRadius: radius.md }}
                        contentStyle={{ height: 48 }}
                    >
                        Entendi
                    </PaperButton>
                </Modal>
            </Portal>
        </ScreenContainer>
    );
}
