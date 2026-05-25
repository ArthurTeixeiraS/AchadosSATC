import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Image, ScrollView, View, Alert } from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";

import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { colors } from "../../../styles/colors";

import { styles } from "./styles";

import { getResourceById } from "../../../services/resources/resourceServices";
import { deleteResource } from "../../../services/resources/resourceServices";

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
    const [resource, setResource] = useState(initialResource);

    const isFerramenta = resource.tipo === "FERRAMENTA";
    const isMaquina = resource.tipo === "MAQUINA";
    const isLaboratorio = resource.tipo === "LABORATORIO";

    const [laboratoryName, setLaboratoryName] = useState("");

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

    function handleDeleteResource() {
        Alert.alert(
            "Excluir recurso",
            "Tem certeza que deseja excluir este recurso? Essa ação não poderá ser desfeita.",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteResource(resource.id);
                            navigation.goBack();
                        } catch (error) {
                            console.log("Erro ao excluir recurso:", error);
                            Alert.alert(
                                "Erro ao excluir",
                                "Não foi possível excluir o recurso. Tente novamente."
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
                            })
                        }
                    >
                        Duplicar recurso
                    </AppButton>

                    <AppButton
                        mode="outlined"
                        icon={() => (
                            <Feather name="trash-2" size={18} color={colors.error} />
                        )}
                        textColor={colors.error}
                        buttonColor={colors.white}
                        style={styles.deleteButton}
                        onPress={handleDeleteResource}
                    >
                        Excluir recurso
                    </AppButton>
                </AppCard>
            </ScrollView>
        </ScreenContainer>
    );
}