import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { AppAlert } from "../../../components/AppAlert";
import { AppButton } from "../../../components/AppButton";
import { AppCard } from "../../../components/AppCard";
import { AppDestructiveButton } from "../../../components/AppDestructiveButton";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getKeyById,
  listKeyMovements,
  returnKey,
  setKeyArchived,
} from "../../../services/keys/keyServices";
import { colors } from "../../../styles/colors";
import { Key, KeyMovement } from "../../../types/Key";
import { styles as globalStyles } from "../KeyListScreen/styles";
import { styles } from "./styles";

export function KeyDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { appUser } = useAuth();
  const { keyId } = route.params;

  const [key, setKey] = useState<Key | null>(null);
  const [movements, setMovements] = useState<KeyMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAcao, setLoadingAcao] = useState(false);

  function getMillis(timestamp?: KeyMovement["retiradaEm"]) {
    if (!timestamp) return 0;
    if (timestamp.toDate) return timestamp.toDate().getTime();
    return timestamp.seconds ? timestamp.seconds * 1000 : 0;
  }

  function formatDate(timestamp?: KeyMovement["retiradaEm"]) {
    const millis = getMillis(timestamp);
    return millis
      ? new Date(millis).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "Data não informada";
  }

  async function loadKey() {
    try {
      setLoading(true);
      const [loadedKey, loadedMovements] = await Promise.all([
        getKeyById(keyId),
        listKeyMovements(keyId),
      ]);

      if (loadedKey) {
        setKey(loadedKey);
        setMovements(loadedMovements);
      } else {
        Alert.alert("Erro", "Chave não encontrada no sistema.");
        navigation.navigate("KeyList");
      }
    } catch (error) {
      console.log("Erro ao carregar detalhes da chave:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes da chave.");
      navigation.navigate("KeyList");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      void loadKey();
    });

    return unsubscribe;
  }, [navigation, keyId]);

  async function handleArchiveToggle() {
    if (!key) return;

    const acaoTexto = key.isArquivado ? "reativar" : "arquivar";

    Alert.alert(
      key.isArquivado ? "Reativar chave" : "Arquivar chave",
      `Tem certeza que deseja ${acaoTexto} esta chave?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoadingAcao(true);
              await setKeyArchived(key.id, !key.isArquivado);
              Alert.alert(
                "Sucesso",
                `Chave ${
                  key.isArquivado ? "reativada" : "arquivada"
                } com sucesso.`
              );
              navigation.navigate("KeyList");
            } catch (error: any) {
              console.log(`Erro ao ${acaoTexto} chave:`, error);
              Alert.alert(
                "Erro",
                error?.message === "KEY_BORROWED"
                  ? "Não é possível arquivar uma chave emprestada."
                  : `Não foi possível ${acaoTexto} a chave.`
              );
            } finally {
              setLoadingAcao(false);
            }
          },
        },
      ]
    );
  }

  async function handleReturn() {
    if (!key || !appUser) return;

    Alert.alert(
      "Confirmar devolução",
      "Registrar a devolução desta chave?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoadingAcao(true);
              await returnKey(key.id, appUser);
              Alert.alert("Sucesso", "Devolução registrada com sucesso.");
              await loadKey();
            } catch (error: any) {
              console.log("Erro ao devolver chave:", error);
              const messages: Record<string, string> = {
                KEY_NOT_BORROWED: "Esta chave não possui retirada em aberto.",
                KEY_ALREADY_RETURNED:
                  "A devolução desta retirada já foi registrada.",
                MOVEMENT_NOT_FOUND:
                  "A movimentação aberta não foi encontrada.",
              };
              Alert.alert(
                "Erro",
                messages[error?.message] ||
                  "Não foi possível registrar a devolução."
              );
            } finally {
              setLoadingAcao(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Buscando detalhes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!key) return null;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AppCard style={styles.headerCard}>
          <View style={globalStyles.cardIconWrapper}>
            <Feather name="key" size={28} color={colors.primary} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.codeText}>{key.codigo}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dotStatus,
                  key.isArquivado
                    ? styles.archivedDot
                    : key.emprestada
                      ? styles.borrowedDot
                      : styles.availableDot,
                ]}
              />
              <Text style={styles.statusText}>
                {key.isArquivado
                  ? "Arquivada"
                  : key.emprestada
                    ? "Emprestada"
                    : "Disponível para retirada"}
              </Text>
            </View>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Informações gerais</Text>

          <View style={styles.infoItem}>
            <Text style={styles.sectionLabel}>Laboratório / Localização</Text>
            <Text style={styles.sectionValue}>{key.localizacao}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoItem}>
            <Text style={styles.sectionLabel}>Descrição do acesso</Text>
            <Text style={styles.sectionValue}>{key.descricao}</Text>
          </View>
        </AppCard>

        {key.emprestada && (
          <AppAlert
            variant="warning"
            title="Chave emprestada"
            message={`Professor ${key.professorAtualNome ?? "não informado"}${
              key.professorAtualCracha
                ? ` · ${key.professorAtualCracha}`
                : ""
            }. Retirada por ${
              key.retiradaPorNome ?? "não informado"
            } em ${formatDate(key.retiradaEm)}.`}
          />
        )}

        <AppCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>

          {!key.isArquivado && !key.emprestada && (
            <AppButton
              icon="login"
              onPress={() =>
                navigation.navigate("KeyWithdrawal", { keyId: key.id })
              }
            >
              Registrar retirada
            </AppButton>
          )}

          {key.emprestada && (
            <AppButton
              icon="logout"
              loading={loadingAcao}
              onPress={handleReturn}
            >
              Registrar devolução
            </AppButton>
          )}

          {!key.isArquivado && !key.emprestada && (
            <AppButton
              icon="pencil"
              onPress={() => navigation.navigate("EditKey", { keyId: key.id })}
            >
              Editar dados
            </AppButton>
          )}

          <AppButton
            mode="outlined"
            icon="clock-outline"
            onPress={() =>
              navigation.navigate("KeyMovementHistory", { keyId: key.id })
            }
            style={styles.btnSecondary}
            textColor={colors.primary}
            buttonColor={colors.white}
          >
            Ver histórico
          </AppButton>

          {key.isArquivado ? (
            <AppButton
              mode="outlined"
              icon="lock-open-variant-outline"
              loading={loadingAcao}
              onPress={handleArchiveToggle}
              style={styles.btnSecondary}
              textColor={colors.primary}
              buttonColor={colors.white}
            >
              Reativar chave
            </AppButton>
          ) : (
            <AppDestructiveButton
              icon="archive-outline"
              loading={loadingAcao}
              onPress={handleArchiveToggle}
            >
              Arquivar chave
            </AppDestructiveButton>
          )}
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Últimas movimentações</Text>
          {movements.length === 0 ? (
            <Text style={styles.sectionValue}>
              Nenhuma retirada registrada para esta chave.
            </Text>
          ) : (
            movements.slice(0, 3).map((movement, index, list) => {
              const isLast = index === list.length - 1;
              const isOpen = movement.status === "EM_ABERTO";

              return (
                <View key={movement.id} style={styles.timelineRow}>
                  <View style={styles.timelineMarkerColumn}>
                    <View style={styles.timelineMarker}>
                      <Feather
                        name="check"
                        size={14}
                        color={colors.white}
                      />
                    </View>

                    {!isLast && <View style={styles.timelineConnector} />}
                  </View>

                  <View
                    style={[
                      styles.timelineContent,
                      isLast && styles.lastTimelineContent,
                    ]}
                  >
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineTitle}>
                        {isOpen
                          ? "Retirada registrada"
                          : "Devolução registrada"}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatDate(
                          isOpen
                            ? movement.retiradaEm
                            : movement.devolvidaEm
                        )}
                      </Text>
                    </View>

                    <Text style={styles.timelineActor}>
                      {isOpen
                        ? movement.retiradaPor.nome
                        : movement.devolvidaPor?.nome ?? "Não informado"}{" "}
                      · Funcionário
                    </Text>

                    <Text style={styles.timelineDetail}>
                      Professor: {movement.professor.nome}
                      {movement.professor.cracha
                        ? ` · ${movement.professor.cracha}`
                        : ""}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}
