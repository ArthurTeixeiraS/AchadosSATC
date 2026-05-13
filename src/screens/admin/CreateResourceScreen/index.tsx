import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";

import { createResource } from "../../../services/resources/resourceServices";
import { RecursosStackParamList } from "../../../routes/RecursosStackRoutes";
import { ResourceStatus, ResourceType } from "../../../types/Resources";

import { styles } from "./styles";
import { AppCard } from "../../../components/AppCard";
import { AppSelect } from "../../../components/AppSelect";

import * as ImagePicker from "expo-image-picker";
import { Image, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { uploadImageAsync } from "../../../services/storage/uploadImage";

type Props = NativeStackScreenProps<
  RecursosStackParamList,
  "CreateResource"
>;

const resourceTypeOptions = [
  { label: "Ferramenta", value: "FERRAMENTA" },
  { label: "Máquina", value: "MAQUINA" },
  { label: "Laboratório", value: "LABORATORIO" },
] as const;

const resourceStatusOptions = [
  { label: "Disponível", value: "DISPONIVEL" },
  { label: "Em uso", value: "EM_USO" },
  { label: "Manutenção", value: "MANUTENCAO" },
  { label: "Indisponível", value: "INDISPONIVEL" },
] as const;

export function CreateResourceScreen({ navigation }: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<ResourceType>("FERRAMENTA");
  const [status, setStatus] = useState<ResourceStatus>("DISPONIVEL");
  const [quantidadeTotal, setQuantidadeTotal] = useState("");
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [imageUri, setImageUri] = useState("");

  const isFerramenta = tipo === "FERRAMENTA";
  const isMaquina = tipo === "MAQUINA";
  const isLaboratorio = tipo === "LABORATORIO";

  function handleChangeTipo(value: ResourceType) {
    setTipo(value);

    if (value === "FERRAMENTA") {
        setPatrimonio("");
    }

    if (value === "MAQUINA") {
        setQuantidadeTotal("");
        setQuantidadeDisponivel("");
    }

    if (value === "LABORATORIO") {
        setPatrimonio("");
        setQuantidadeTotal("");
        setQuantidadeDisponivel("");
    }
}

async function handlePickImage() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return;
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

  if (!result.canceled) {
    setImageUri(result.assets[0].uri);
  }
}

  async function handleCreateResource() {
    try {
        setErro("");

        if (!nome.trim()) {
        setErro("Informe o nome do recurso.");
        return;
        }

        setLoading(true);

        let imagemUrl: string | undefined;

        if (isFerramenta && imageUri) {
        const imagePath = `recursos/${Date.now()}-${nome.trim()}.jpg`;

        imagemUrl = await uploadImageAsync(imageUri, imagePath);
        }

        await createResource({
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo,
        status,
        localizacao: localizacao.trim() || undefined,
        patrimonio: patrimonio.trim() || undefined,
        quantidadeTotal: quantidadeTotal
            ? Number(quantidadeTotal)
            : undefined,
        quantidadeDisponivel: quantidadeDisponivel
            ? Number(quantidadeDisponivel)
            : undefined,
        imagemUrl,
        });

        navigation.goBack();
    } catch (error) {
        console.log("Erro ao cadastrar recurso:", error);
        setErro("Não foi possível cadastrar o recurso.");
    } finally {
        setLoading(false);
    }
}

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageTitle
          title="Novo recurso"
          subtitle="Cadastre ferramentas, máquinas ou laboratórios."
        />

        <AppCard>
            <AppSelect
                label="Tipo"
                value={tipo}
                options={resourceTypeOptions}
                onChange={handleChangeTipo}
            />
            <AppInput
                value={nome}
                onChangeText={setNome}
                placeholder="Nome do simples do recurso"
            />

            <AppInput
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Descrição detalhada do recurso, tamanho, modelo, etc"
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
                <AppInput
                    value={quantidadeTotal}
                    onChangeText={setQuantidadeTotal}
                    placeholder="Quantidade total"
                    keyboardType="numeric"
                />

                <AppInput
                    value={quantidadeDisponivel}
                    onChangeText={setQuantidadeDisponivel}
                    placeholder="Quantidade disponível"
                    keyboardType="numeric"
                />

                <AppInput
                    value={localizacao}
                    onChangeText={setLocalizacao}
                    placeholder="Localização"
                />

                <View style={styles.imageSection}>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={handlePickImage}
                    >
                        {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.imagePreview}
                        />
                        ) : (
                        <>
                            <Feather
                            name="image"
                            size={28}
                            color="#6B7280"
                            />

                            <Text style={styles.imageText}>
                            Selecionar foto
                            </Text>
                        </>
                        )}
                    </TouchableOpacity>
                </View>
            </>
            )}

            {isMaquina && (
            <>
                <AppInput
                    value={patrimonio}
                    onChangeText={setPatrimonio}
                    placeholder="Patrimônio"
                />

                <AppInput
                    value={localizacao}
                    onChangeText={setLocalizacao}
                    placeholder="Laboratório/localização"
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

        </AppCard>
        {!!erro && <Text style={styles.errorText}>{erro}</Text>}

        <AppButton loading={loading} onPress={handleCreateResource}>
          Cadastrar recurso
        </AppButton>

        <AppButton
          mode="outlined"
          disabled={loading}
          onPress={() => navigation.goBack()}
        >
          Cancelar
        </AppButton>
      </ScrollView>
    </ScreenContainer>
  );
}