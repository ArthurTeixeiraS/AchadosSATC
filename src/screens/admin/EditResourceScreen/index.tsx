import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";
import { AppSelect } from "../../../components/AppSelect";

import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { Resource, ResourceStatus } from "../../../types/Resources";
import {
    listLaboratories,
    updateResource,
} from "../../../services/resources/resourceServices";
import { uploadImageAsync } from "../../../services/storage/uploadImage";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";

type Props = NativeStackScreenProps<ResourceStackParamList, "EditResource">;

const resourceStatusOptions = [
    { label: "Disponível", value: "DISPONIVEL" },
    { label: "Em uso", value: "EM_USO" },
    { label: "Manutenção", value: "MANUTENCAO" },
] as const;

export function EditResourceScreen({ route, navigation }: Props) {
    const { resource } = route.params;

    const [nome, setNome] = useState(resource.nome);
    const [descricao, setDescricao] = useState(resource.descricao ?? "");
    const [status, setStatus] = useState<ResourceStatus>(resource.status);

    const [quantidadeTotal, setQuantidadeTotal] = useState(
        resource.quantidadeTotal?.toString() ?? ""
    );

    const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(
        resource.quantidadeDisponivel?.toString() ?? ""
    );

    const [patrimonio, setPatrimonio] = useState(resource.patrimonio ?? "");
    const [localizacao, setLocalizacao] = useState(resource.localizacao ?? "");
    const [laboratorioId, setLaboratorioId] = useState(
        resource.laboratorioId ?? ""
    );

    const [imageUri, setImageUri] = useState(resource.imagemUrl ?? "");
    const [laboratories, setLaboratories] = useState<Resource[]>([]);

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const isFerramenta = resource.tipo === "FERRAMENTA";
    const isMaquina = resource.tipo === "MAQUINA";
    const isLaboratorio = resource.tipo === "LABORATORIO";

    const laboratoryOptions = laboratories.map((lab) => ({
        label: lab.nome,
        value: lab.id,
    }));

    useEffect(() => {
        async function loadLaboratories() {
            const data = await listLaboratories();
            setLaboratories(data);

            if (isMaquina && data.length === 0) {
                Alert.alert(
                    "Nenhum laboratório cadastrado",
                    "Para editar uma máquina, é necessário ter pelo menos um laboratório cadastrado.",
                    [
                        {
                            text: "OK",
                            onPress: () =>
                                navigation.navigate("ResourceDetails", {
                                    resource,
                                }),
                        },
                    ]
                );
            }
        }

        loadLaboratories();
    }, []);

    function handleChangeQuantidadeTotal(value: string) {
        setQuantidadeTotal(value);

        if (!quantidadeDisponivel || quantidadeDisponivel === quantidadeTotal) {
            setQuantidadeDisponivel(value);
        }
    }

    async function handlePickImageFromGallery() {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            setErro("Permissão para acessar a galeria negada.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    }

    async function handleTakePhoto() {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
            setErro("Permissão para acessar a câmera negada.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    }

    async function handleUpdateResource() {
        if (loading) return;

        try {
            setErro("");

            if (!nome.trim()) {
                setErro("Informe o nome do recurso.");
                return;
            }

            if (isMaquina && !laboratorioId) {
                setErro("Selecione o laboratório da máquina.");
                return;
            }

            setLoading(true);

            let imagemUrl = resource.imagemUrl;

            const hasNewLocalImage =
                isFerramenta && imageUri && !imageUri.startsWith("http");

            if (hasNewLocalImage) {
                const imagePath = `recursos/${resource.id}/imagem.jpg`;
                imagemUrl = await uploadImageAsync(imageUri, imagePath);
            }

            await updateResource(resource.id, {
                nome: nome.trim(),
                descricao: descricao.trim() || undefined,
                tipo: resource.tipo,
                status,

                quantidadeTotal:
                    isFerramenta && quantidadeTotal
                        ? Number(quantidadeTotal)
                        : undefined,

                quantidadeDisponivel:
                    isFerramenta && quantidadeDisponivel
                        ? Number(quantidadeDisponivel)
                        : undefined,

                imagemUrl: isFerramenta ? imagemUrl : undefined,

                patrimonio: isMaquina
                    ? patrimonio.trim() || undefined
                    : undefined,

                laboratorioId: isMaquina ? laboratorioId : undefined,

                localizacao: isLaboratorio
                    ? localizacao.trim() || undefined
                    : undefined,
            });

            navigation.navigate("ResourceDetails", {
                resource,
            });
        } catch (error) {
            console.log("Erro ao editar recurso:", error);
            setErro("Não foi possível editar o recurso.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScreenContainer>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.typeBox}>
                    <Text style={styles.typeLabel}>Tipo do recurso</Text>
                    <Text style={styles.typeValue}>{resource.tipo}</Text>
                </View>

                <AppInput
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Nome do recurso"
                />

                <AppInput
                    value={descricao}
                    onChangeText={setDescricao}
                    placeholder="Descrição"
                    multiline
                />

                <AppSelect
                    label="Status"
                    value={status}
                    options={resourceStatusOptions}
                    onChange={setStatus}
                />

                {isFerramenta && (
                    <>
                        <View style={styles.imageSection}>
                            <View style={styles.imagePicker}>
                                {imageUri ? (
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.imagePreview}
                                    />
                                ) : (
                                    <>
                                        <Feather
                                            name="image"
                                            size={32}
                                            color={colors.textSecondary}
                                        />

                                        <Text style={styles.imageText}>
                                            Nenhuma imagem selecionada
                                        </Text>
                                    </>
                                )}
                            </View>

                            <View style={styles.imageOptions}>
                                <TouchableOpacity
                                    style={styles.imageOptionButton}
                                    onPress={handleTakePhoto}
                                >
                                    <Feather
                                        name="camera"
                                        size={18}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.imageOptionText}>Câmera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.imageOptionButton}
                                    onPress={handlePickImageFromGallery}
                                >
                                    <Feather
                                        name="image"
                                        size={18}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.imageOptionText}>Galeria</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <AppInput
                            value={quantidadeTotal}
                            onChangeText={handleChangeQuantidadeTotal}
                            placeholder="Quantidade total"
                            keyboardType="numeric"
                        />

                        <AppInput
                            value={quantidadeDisponivel}
                            onChangeText={setQuantidadeDisponivel}
                            placeholder="Quantidade disponível"
                            keyboardType="numeric"
                        />
                    </>
                )}

                {isMaquina && (
                    <>
                        <AppSelect
                            label="Laboratório"
                            value={laboratorioId}
                            options={laboratoryOptions}
                            onChange={setLaboratorioId}
                        />

                        <AppInput
                            value={patrimonio}
                            onChangeText={setPatrimonio}
                            placeholder="Patrimônio"
                        />
                    </>
                )}

                {isLaboratorio && (
                    <AppInput
                        value={localizacao}
                        onChangeText={setLocalizacao}
                        placeholder="Localização do laboratório"
                    />
                )}

                {!!erro && <Text style={styles.errorText}>{erro}</Text>}

                <AppButton
                    loading={loading}
                    disabled={loading}
                    onPress={handleUpdateResource}>
                    Salvar alterações
                </AppButton>

            </ScrollView>
        </ScreenContainer>
    );
}
