import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppInput } from "../../../components/AppInput";
import { AppCard } from "../../../components/AppCard";
import { AppButton } from "../../../components/AppButton";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { AppAlert } from "../../../components/AppAlert";

import { NovaSolicitacaoStackParamList } from "../../../routes/NovaSolicitacaoStackRoutes";
import { useSolicitationDraft } from "../../../contexts/SolicitationDraftContext";
import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";
import {
  getMachinesAvailabilityForPeriod,
  MachinePeriodAvailability,
} from "../../../services/solicitations/solicitationServices";

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
  const [availabilityByMachineId, setAvailabilityByMachineId] = useState<
    Record<string, MachinePeriodAvailability>
  >({});

  async function loadResources() {
    try {
      setLoading(true);

      const data = await listResources();
      const loadedMachines = data.filter(
        (item) => item.tipo === "MAQUINA"
      );
      const availability = draft.turno
        ? await getMachinesAvailabilityForPeriod(
            loadedMachines,
            draft.dataUtilizacao,
            draft.turno
          )
        : {};

      setMachines(loadedMachines);
      setLaboratories(data.filter((item) => item.tipo === "LABORATORIO"));
      setAvailabilityByMachineId(availability);
    } catch (error) {
      console.log("Erro ao buscar máquinas:", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [draft.dataUtilizacao, draft.turno])
  );

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

    if (!availabilityByMachineId[machine.id]?.available) {
      Alert.alert(
        "Máquina indisponível",
        "Essa máquina já está reservada para a data e o turno selecionados."
      );
      return;
    }

    addMachine(machine);
  }

  function handleContinue() {
    if (invalidSelectedMachines.length > 0) {
      Alert.alert(
        "Revise as máquinas",
        "Uma ou mais máquinas não estão disponíveis neste período."
      );
      return;
    }

    navigation.navigate("SelectTools");
  }

  const invalidSelectedMachines = draft.maquinasSelecionadas.filter(
    (item) => !availabilityByMachineId[item.resource.id]?.available
  );

  if (loading) {
    return <Loading message="Carregando máquinas..." />;
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
              const available =
                availabilityByMachineId[item.id]?.available ?? false;

              return (
                <AppCard style={styles.machineCard}>
                  <Text style={styles.machineName}>{item.nome}</Text>

                  <Text style={styles.machineLaboratory}>
                    {getLaboratoryName(item.laboratorioId)}
                  </Text>

                  <Text
                    style={[
                      styles.machineStatus,
                      !available && styles.machineStatusUnavailable,
                    ]}
                  >
                    {available
                      ? "Disponível no período"
                      : "Indisponível no período"}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.machineButton,
                      selected && styles.machineButtonSelected,
                      !available &&
                        !selected &&
                        styles.machineButtonDisabled,
                    ]}
                    disabled={!available && !selected}
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

      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={styles.bottomSummary}
      >
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

        {invalidSelectedMachines.length > 0 && (
          <AppAlert
            variant="error"
            title="Máquinas indisponíveis:"
            message={invalidSelectedMachines
              .map((item) => item.resource.nome)
              .join(", ")}
          />
        )}

        <View style={styles.summaryButtons}>
          <AppButton
            disabled={invalidSelectedMachines.length > 0}
            onPress={handleContinue}
          >
            Continuar para Ferramentas
          </AppButton>

        </View>
      </SafeAreaView>
    </View>
  );
}
