import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { AppQuantityStepper } from "../../../components/AppQuantityStepper";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";

type Props = NativeStackScreenProps<
  NovaSolicitacaoStackParamList,
  "SelectTools"
>;

export function SelectToolsScreen({ navigation }: Props) {
  const {
    draft,
    addTool,
    removeTool,
    updateToolQuantity,
  } = useSolicitationDraft();

  const [tools, setTools] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTools() {
    try {
      setLoading(true);

      const data = await listResources();

      setTools(data.filter((item) => item.tipo === "FERRAMENTA"));
    } catch (error) {
      console.log("Erro ao buscar ferramentas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTools();
  }, []);

  const filteredTools = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    return tools.filter((tool) =>
      tool.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [tools, search]);

  function getSelectedTool(resourceId: string) {
    return draft.ferramentasSelecionadas.find(
      (item) => item.resource.id === resourceId
    );
  }

  function handleAddTool(tool: Resource) {
    const availableQuantity = tool.quantidadeDisponivel ?? 0;

    if (availableQuantity <= 0) {
      Alert.alert(
        "Ferramenta indisponível",
        "Essa ferramenta não possui quantidade disponível."
      );
      return;
    }

    addTool(tool);
  }

  function handleContinue() {
    navigation.navigate("ReviewSolicitation");
  }

  if (loading) {
    return <Loading message="Carregando ferramentas..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenContainer
        edges={["left", "right"]}
        style={styles.screenContent}
      >
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pelo nome da ferramenta"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
        />

        {!search.trim() ? (
          <AppCard>
            <EmptyState
              icon="search"
              title="Pesquise uma ferramenta"
              message="Digite o nome da ferramenta para visualizar os resultados."
            />
          </AppCard>
        ) : filteredTools.length === 0 ? (
          <AppCard>
            <EmptyState
              icon="search"
              title="Nenhuma ferramenta encontrada"
              message="Tente buscar por outro nome."
            />
          </AppCard>
        ) : (
          <FlatList
            data={filteredTools}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selectedTool = getSelectedTool(item.id);
              const selectedQuantity = selectedTool?.quantidade ?? 0;
              const availableQuantity = item.quantidadeDisponivel ?? 0;

              return (
                <AppCard style={styles.toolCard}>
                  <View style={styles.toolHeader}>
                    <View style={styles.toolInfo}>
                      <Text style={styles.toolName}>{item.nome}</Text>

                      {!!item.descricao && (
                        <Text style={styles.toolDescription}>
                          {item.descricao}
                        </Text>
                      )}

                      <Text style={styles.toolAvailability}>
                        Disponível: {availableQuantity}
                      </Text>
                    </View>

                    {selectedTool ? (
                      <AppQuantityStepper
                        value={selectedQuantity}
                        min={1}
                        max={availableQuantity}
                        onChange={(value) =>
                          updateToolQuantity(item.id, value)
                        }
                        onRemove={() => removeTool(item.id)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddTool(item)}
                      >
                        <Feather
                          name="plus"
                          size={16}
                          color={colors.white}
                        />

                        <Text style={styles.addButtonText}>
                          Adicionar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </AppCard>
              );
            }}
          />
        )}
      </ScreenContainer>

      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={styles.bottomSummary}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Ferramentas selecionadas</Text>

          <Text style={styles.summaryCount}>
            {draft.ferramentasSelecionadas.length} item
            {draft.ferramentasSelecionadas.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {draft.ferramentasSelecionadas.length === 0 ? (
          <Text style={styles.summaryEmpty}>
            Nenhuma ferramenta selecionada.
          </Text>
        ) : (
          draft.ferramentasSelecionadas.slice(0, 3).map((item) => (
            <Text key={item.resource.id} style={styles.summaryItem}>
              {item.quantidade}x {item.resource.nome}
            </Text>
          ))
        )}

        {draft.ferramentasSelecionadas.length > 3 && (
          <Text style={styles.summaryMore}>
            + {draft.ferramentasSelecionadas.length - 3} ferramenta(s)
          </Text>
        )}

        <View style={styles.summaryButtons}>
          <AppButton onPress={handleContinue}>
            Revisar Solicitação
          </AppButton>

        </View>
      </SafeAreaView>
    </View>
  );
}
