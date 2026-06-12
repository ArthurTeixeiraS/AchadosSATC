import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "../../../components/AppButton";
import { AppCard } from "../../../components/AppCard";
import { AppQuantityStepper } from "../../../components/AppQuantityStepper";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import { FuncionarioSolicitacaoStackParamList } from "../../../routes/FuncionarioSolicitacaoStackRoutes";
import {
  getSolicitationById,
  registerSolicitationReturn,
  SolicitationBusinessError,
} from "../../../services/solicitations/solicitationServices";
import { Solicitation } from "../../../types/Solicitation";

import { styles } from "./styles";

type Props = NativeStackScreenProps<
  FuncionarioSolicitacaoStackParamList,
  "RegisterSolicitationReturn"
>;

export function RegisterSolicitationReturnScreen({
  route,
  navigation,
}: Props) {
  const { solicitationId } = route.params;
  const { appUser } = useAuth();

  const [solicitation, setSolicitation] =
    useState<Solicitation | null>(null);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [toolQuantities, setToolQuantities] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSolicitation() {
      try {
        setLoading(true);
        const data = await getSolicitationById(solicitationId);
        setSolicitation(data);
      } catch (error) {
        console.log("Erro ao carregar devolução:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSolicitation();
  }, [solicitationId]);

  const pendingMachines = useMemo(
    () => solicitation?.maquinas.filter((machine) => !machine.devolvida) ?? [],
    [solicitation]
  );
  const pendingTools = useMemo(
    () =>
      solicitation?.ferramentas.filter(
        (tool) =>
          Number(tool.quantidade) -
            Number(tool.quantidadeDevolvida ?? 0) >
          0
      ) ?? [],
    [solicitation]
  );
  const selectedToolCount = Object.values(toolQuantities).reduce(
    (total, quantity) => total + quantity,
    0
  );
  const hasSelection =
    selectedMachines.length > 0 || selectedToolCount > 0;
  const allMachinesSelected =
    pendingMachines.length > 0 &&
    pendingMachines.every((machine) =>
      selectedMachines.includes(machine.recursoId)
    );
  const someMachinesSelected =
    selectedMachines.length > 0 && !allMachinesSelected;
  const allToolsSelected =
    pendingTools.length > 0 &&
    pendingTools.every((tool) => {
      const pending =
        Number(tool.quantidade) -
        Number(tool.quantidadeDevolvida ?? 0);

      return (toolQuantities[tool.recursoId] ?? 0) === pending;
    });
  const someToolsSelected =
    selectedToolCount > 0 && !allToolsSelected;

  function toggleMachine(resourceId: string) {
    setSelectedMachines((current) =>
      current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId]
    );
  }

  function updateToolQuantity(resourceId: string, quantity: number) {
    setToolQuantities((current) => ({
      ...current,
      [resourceId]: quantity,
    }));
  }

  function toggleAllMachines() {
    setSelectedMachines(
      allMachinesSelected
        ? []
        : pendingMachines.map((machine) => machine.recursoId)
    );
  }

  function toggleAllTools() {
    setToolQuantities((current) => {
      const next = { ...current };

      pendingTools.forEach((tool) => {
        next[tool.recursoId] = allToolsSelected
          ? 0
          : Number(tool.quantidade) -
            Number(tool.quantidadeDevolvida ?? 0);
      });

      return next;
    });
  }

  async function handleConfirm() {
    if (!appUser || !solicitation || submitting || !hasSelection) {
      return;
    }

    try {
      setSubmitting(true);

      await registerSolicitationReturn(
        solicitation.id,
        appUser,
        {
          maquinasIds: selectedMachines,
          ferramentas: Object.entries(toolQuantities)
            .filter(([, quantity]) => quantity > 0)
            .map(([recursoId, quantidade]) => ({
              recursoId,
              quantidade,
            })),
        }
      );

      Alert.alert(
        "Devolução registrada",
        "Os recursos selecionados foram devolvidos com sucesso.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.log("Erro ao registrar devolução:", error);

      Alert.alert(
        error instanceof SolicitationBusinessError
          ? "Devolução bloqueada"
          : "Erro ao devolver",
        error instanceof SolicitationBusinessError
          ? error.message
          : "Não foi possível registrar a devolução. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando recursos pendentes..." />;
  }

  if (!solicitation || solicitation.status !== "EM_USO") {
    return (
      <ScreenContainer>
        <AppCard>
          <EmptyState
            icon="check-circle"
            title="Devolução indisponível"
            message="Esta solicitação não possui recursos pendentes em uso."
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppCard>
          <Text style={styles.title}>Recursos pendentes</Text>
          <Text style={styles.description}>
            Selecione somente os itens recebidos nesta devolução.
          </Text>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Máquinas</Text>

            {pendingMachines.length > 0 && (
              <TouchableOpacity
                style={styles.selectAll}
                onPress={toggleAllMachines}
              >
                <Checkbox
                  status={
                    allMachinesSelected
                      ? "checked"
                      : someMachinesSelected
                        ? "indeterminate"
                        : "unchecked"
                  }
                />
                <Text style={styles.selectAllText}>Marcar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {pendingMachines.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="Todas as máquinas foram devolvidas"
            />
          ) : (
            pendingMachines.map((machine) => {
              const selected = selectedMachines.includes(
                machine.recursoId
              );

              return (
                <TouchableOpacity
                  key={machine.recursoId}
                  style={styles.selectionRow}
                  onPress={() => toggleMachine(machine.recursoId)}
                >
                  <Checkbox
                    status={selected ? "checked" : "unchecked"}
                  />
                  <View style={styles.selectionText}>
                    <Text style={styles.resourceName}>
                      {machine.nome}
                    </Text>
                    <Text style={styles.resourceMeta}>
                      Devolver nesta operação
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ferramentas</Text>

            {pendingTools.length > 0 && (
              <TouchableOpacity
                style={styles.selectAll}
                onPress={toggleAllTools}
              >
                <Checkbox
                  status={
                    allToolsSelected
                      ? "checked"
                      : someToolsSelected
                        ? "indeterminate"
                        : "unchecked"
                  }
                />
                <Text style={styles.selectAllText}>Marcar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {pendingTools.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="Todas as ferramentas foram devolvidas"
            />
          ) : (
            pendingTools.map((tool) => {
              const pending =
                Number(tool.quantidade) -
                Number(tool.quantidadeDevolvida ?? 0);
              const selected = toolQuantities[tool.recursoId] ?? 0;

              return (
                <View key={tool.recursoId} style={styles.toolRow}>
                  <View style={styles.selectionText}>
                    <Text style={styles.resourceName}>{tool.nome}</Text>
                    <Text style={styles.resourceMeta}>
                      Pendente: {pending}
                    </Text>
                  </View>

                  <AppQuantityStepper
                    value={selected}
                    min={0}
                    max={pending}
                    onChange={(quantity) =>
                      updateToolQuantity(tool.recursoId, quantity)
                    }
                  />
                </View>
              );
            })
          )}
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Resumo da devolução</Text>
          <Text style={styles.summaryText}>
            {selectedMachines.length} máquina(s) e {selectedToolCount}{" "}
            ferramenta(s) selecionada(s).
          </Text>
        </AppCard>

        <AppButton
          loading={submitting}
          disabled={!hasSelection || submitting}
          onPress={handleConfirm}
        >
          Confirmar devolução
        </AppButton>
      </ScrollView>
    </ScreenContainer>
  );
}
