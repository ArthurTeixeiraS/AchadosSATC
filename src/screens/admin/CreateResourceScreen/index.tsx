import React, { useEffect, useState } from "react";
import { ScrollView, Image, TouchableOpacity, View, Alert } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppButton } from "../../../components/AppButton";

import { createResource, listLaboratories } from "../../../services/resources/resourceServices";
import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";
import { Resource, ResourceStatus, ResourceType } from "../../../types/Resources";

import { styles } from "./styles";
import { AppCard } from "../../../components/AppCard";
import { AppSelect } from "../../../components/AppSelect";

import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import { uploadImageAsync } from "../../../services/storage/uploadImage";
import { colors } from "../../../styles/colors";

type Props = NativeStackScreenProps<
  ResourceStackParamList,
  "CreateResource"
>;

const resourceTypeOptions = [
  { label: "Ferramenta", value: "FERRAMENTA" },
  { label: "Máquina", value: "MAQUINA" },
  { label: "Laboratório", value: "LABORATORIO" },
] as const;

export function CreateResourceScreen({ navigation, route }: Props) {
  const initialType = route.params?.initialType ?? "FERRAMENTA";
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<ResourceType>(initialType);
  const [status] = useState<ResourceStatus>("DISPONIVEL");
  const [quantidadeTotal, setQuantidadeTotal] = useState("");
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [laboratories, setLaboratories] = useState<Resource[]>([]);
  const [laboratorioId, setLaboratorioId] = useState("");

  const isFerramenta = tipo === "FERRAMENTA";
  const isMaquina = tipo === "MAQUINA";
  const isLaboratorio = tipo === "LABORATORIO";

  const laboratoryOptions = laboratories.map((lab) => ({
    label: lab.nome,
    value: lab.id,
  }));

  useEffect(() => {
    async function loadLaboratories() {
      const data = await listLaboratories();
      setLaboratories(data);
    }

    loadLaboratories();
  }, []);

  function handleChangeTipo(value: ResourceType) {
    if (value === "MAQUINA" && laboratories.length === 0) {
      showNoLaboratoryAlert();
      return;
    }

    setTipo(value);

    if (value === "FERRAMENTA") {
      setPatrimonio("");
      setLaboratorioId("");
    }

    if (value === "MAQUINA") {
      setQuantidadeTotal("");
      setQuantidadeDisponivel("");
    }

    if (value === "LABORATORIO") {
      setPatrimonio("");
      setQuantidadeTotal("");
      setQuantidadeDisponivel("");
      setLaboratorioId("");
      setImageUri("");
    }
  }

  function showNoLaboratoryAlert() {
    Alert.alert(
      "Nenhum laboratório cadastrado",
      "Para cadastrar uma máquina, é necessário cadastrar pelo menos um laboratório primeiro.",
      [
        {
          text: "OK",
          onPress: () =>
            navigation.replace("CreateResource", {
              initialType: "LABORATORIO",
            }),
        },
      ]
    );
  }

  function handleChangeQuantidadeTotal(value: string) {
    setQuantidadeTotal(value);

    if (!quantidadeDisponivel || quantidadeDisponivel === quantidadeTotal) {
      setQuantidadeDisponivel(value);
    }
  }

  async function handlePickImageFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

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

  async function handleCreateResource() {
    if (loading) return;

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

      if (isMaquina && !laboratorioId) {
        setErro("Selecione o laboratório da máquina.");
        return;
      }

      await createResource({
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo,
        status: "DISPONIVEL",
        localizacao: localizacao.trim() || undefined,
        patrimonio: patrimonio.trim() || undefined,
        quantidadeTotal: quantidadeTotal
          ? Number(quantidadeTotal)
          : undefined,
        quantidadeDisponivel: quantidadeDisponivel
          ? Number(quantidadeDisponivel)
          : undefined,
        imagemUrl,
        laboratorioId: isMaquina ? laboratorioId : undefined,
      });

      navigation.navigate("ResourceList");
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
            placeholder="Nome simples do recurso"
          />

          <AppInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descrição detalhada do recurso, tamanho, modelo, etc"
            multiline
          />

          {isFerramenta && (
            <>
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
                    <Feather name="camera" size={18} color={colors.primary} />
                    <Text style={styles.imageOptionText}>Câmera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.imageOptionButton}
                    onPress={handlePickImageFromGallery}
                  >
                    <Feather name="image" size={18} color={colors.primary} />
                    <Text style={styles.imageOptionText}>Galeria</Text>
                  </TouchableOpacity>
                </View>
              </View>

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

        </AppCard>
        {!!erro && <Text style={styles.errorText}>{erro}</Text>}

        <AppButton
          loading={loading}
          disabled={loading}
          onPress={handleCreateResource}>
          Cadastrar recurso
        </AppButton>

      </ScrollView>
    </ScreenContainer>
  );
}
