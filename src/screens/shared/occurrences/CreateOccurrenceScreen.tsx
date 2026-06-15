import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";

import { AppAlert } from "../../../components/AppAlert";
import { AppButton } from "../../../components/AppButton";
import { AppCard } from "../../../components/AppCard";
import { AppInput } from "../../../components/AppInput";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { OccurrenceStackParamList } from "../../../routes/OccurrenceStackRoutes";
import { createOccurrence } from "../../../services/occurrences/occurrenceServices";
import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";
import { normalizeFilterText } from "../../../components/AppListFilter";
import { styles } from "./styles";

type Props = NativeStackScreenProps<
  OccurrenceStackParamList,
  "CreateOccurrence"
>;

export function CreateOccurrenceScreen({ navigation }: Props) {
  const { appUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listResources()
      .then((data) => {
        if (active) setResources(data);
      })
      .catch((loadError) => {
        console.log("Erro ao carregar recursos:", loadError);
        if (active) setError("Não foi possível carregar os recursos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const normalized = normalizeFilterText(search);
    if (!normalized) return resources;

    return resources.filter((resource) =>
      [
        resource.nome,
        resource.patrimonio,
        resource.localizacao,
        resource.descricao,
      ].some((value) => normalizeFilterText(value).includes(normalized))
    );
  }, [resources, search]);

  async function handleSubmit() {
    if (!appUser) {
      setError("Não foi possível identificar o usuário responsável.");
      return;
    }
    if (!selected) {
      setError("Selecione o recurso relacionado.");
      return;
    }
    if (!description.trim()) {
      setError("Descreva o problema encontrado.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const occurrenceId = await createOccurrence(
        selected,
        description,
        appUser
      );
      navigation.replace("OccurrenceDetails", { occurrenceId });
    } catch (submitError) {
      console.log("Erro ao criar ocorrência:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível registrar a ocorrência."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando recursos..." />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        {!!error && (
          <View style={styles.alert}>
            <AppAlert variant="error" message={error} />
          </View>
        )}

        <AppCard>
          <Text style={styles.sectionTitle}>Recurso relacionado</Text>
          <AppInput
            value={search}
            onChangeText={setSearch}
            label="Buscar recurso"
            placeholder="Nome, patrimônio ou localização"
            style={styles.resourceSearch}
          />

          <ScrollView
            nestedScrollEnabled
            style={styles.resourceList}
          >
            {filteredResources.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelected(item)}
              >
                <AppCard
                  style={[
                    styles.card,
                    selected?.id === item.id && styles.selectedCard,
                  ]}
                >
                  <Text style={styles.title}>{item.nome}</Text>
                  <Text style={styles.subtitle}>
                    {item.tipo === "FERRAMENTA"
                      ? "Ferramenta"
                      : item.tipo === "MAQUINA"
                        ? "Máquina"
                        : "Laboratório"}
                    {item.patrimonio ? ` • ${item.patrimonio}` : ""}
                  </Text>
                </AppCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Descrição do problema</Text>
          <AppInput
            value={description}
            onChangeText={setDescription}
            label="Descrição"
            placeholder="Explique o que foi identificado"
            multiline
            numberOfLines={5}
          />
        </AppCard>

        <AppButton loading={saving} onPress={handleSubmit}>
          Registrar ocorrência
        </AppButton>
      </ScrollView>
    </ScreenContainer>
  );
}
