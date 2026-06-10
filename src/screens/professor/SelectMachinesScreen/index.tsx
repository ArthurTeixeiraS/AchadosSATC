import React, { useEffect, useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";

import { colors } from "../../../styles/colors";
import { styles } from "./styles";

type Props = NativeStackScreenProps<
  NovaSolicitacaoStackParamList,
  "SelectMachines"
>;

export function SelectMachinesScreen({ navigation }: Props) {
  const { draft, addMachine, removeMachine } = useSolicitationDraft();

  const [machines, setMachines] = useState<Resource[]>([]);
  const [laboratories, setLaboratories] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadResources() {
    try {
      setLoading(true);

      const data = await listResources();

      setMachines(data.filter((item) => item.tipo === "MAQUINA"));
      setLaboratories(data.filter((item) => item.tipo === "LABORATORIO"));
    } catch (error) {
      console.log("Erro ao buscar máquinas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  const filteredMachines = useMemo(() => {
    if (!search.trim()) {
      return machines;
    }

    return machines.filter((machine) =>
      machine.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [machines, search]);

  function isSelected(resourceId: string) {
    return draft.maquinasSelecionadas.some(
      (item) => item.resource.id === resourceId
    );
  }

  function getLaboratoryName(laboratorioId?: string) {
    if (!laboratorioId) {
      return "Laboratório não informado";
    }

    const laboratory = laboratories.find((item) => item.id === laboratorioId);

    return laboratory?.nome ?? "Laboratório não encontrado";
  }

  function handleToggleMachine(machine: Resource) {
    if (isSelected(machine.id)) {
      removeMachine(machine.id);
      return;
    }

    addMachine(machine);
  }

  function handleContinue() {
    navigation.navigate("SelectTools");
  }

  if (loading) {
    return <Loading message="Carregando máquinas..." />;
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Selecionar Máquinas</Text>
      </View> */}

      <ScreenContainer style={styles.screenContent}>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar pelo nome da máquina"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
        />

        {filteredMachines.length === 0 ? (
          <AppCard>
            <EmptyState
              icon="search"
              title="Nenhuma máquina encontrada"
              message="Tente buscar por outro nome."
            />
          </AppCard>
        ) : (
          <FlatList
            data={filteredMachines}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selected = isSelected(item.id);

              return (
                <AppCard style={styles.machineCard}>
                  <Text style={styles.machineName}>{item.nome}</Text>

                  <Text style={styles.machineLaboratory}>
                    {getLaboratoryName(item.laboratorioId)}
                  </Text>

                  <Text style={styles.machineStatus}>Disponível</Text>

                  <TouchableOpacity
                    style={[
                      styles.machineButton,
                      selected && styles.machineButtonSelected,
                    ]}
                    onPress={() => handleToggleMachine(item)}
                  >
                    <Feather
                      name={selected ? "check" : "plus"}
                      size={16}
                      color={selected ? colors.primary : colors.white}
                    />

                    <Text
                      style={[
                        styles.machineButtonText,
                        selected && styles.machineButtonTextSelected,
                      ]}
                    >
                      {selected ? "Selecionado" : "Adicionar"}
                    </Text>
                  </TouchableOpacity>
                </AppCard>
              );
            }}
          />
        )}
      </ScreenContainer>

      <View style={styles.bottomSummary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Máquinas selecionadas</Text>
          <Text style={styles.summaryCount}>
            {draft.maquinasSelecionadas.length} item
            {draft.maquinasSelecionadas.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {draft.maquinasSelecionadas.length === 0 ? (
          <Text style={styles.summaryEmpty}>Nenhuma máquina selecionada.</Text>
        ) : (
          draft.maquinasSelecionadas.slice(0, 3).map((item) => (
            <Text key={item.resource.id} style={styles.summaryItem}>
              {item.resource.nome}
            </Text>
          ))
        )}

        {draft.maquinasSelecionadas.length > 3 && (
          <Text style={styles.summaryMore}>
            + {draft.maquinasSelecionadas.length - 3} máquina(s)
          </Text>
        )}

        <View style={styles.summaryButtons}>
          <AppButton onPress={handleContinue}>
            Continuar para Ferramentas
          </AppButton>

          <AppButton
            mode="outlined"
            buttonColor={colors.white}
            textColor={colors.text}
            onPress={() => navigation.goBack()}
          >
            Voltar para Informações
          </AppButton>
        </View>
      </View>
    </View>
  );
}
