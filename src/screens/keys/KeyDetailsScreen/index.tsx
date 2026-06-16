import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { AppAlert } from "../../../components/AppAlert";
import { AppButton } from "../../../components/AppButton";
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
      "Confirmar Ação",
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
                } com sucesso!`
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
          <Text style={{ marginTop: 12, color: "#6B7280" }}>
            Buscando detalhes...
          </Text>
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
        <View style={styles.headerCard}>
          <View style={globalStyles.cardIconWrapper}>
            <Feather name="key" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeText}>{key.codigo}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View
                style={[
                  styles.dotStatus,
                  {
                    backgroundColor: key.isArquivado
                      ? "#EF4444"
                      : key.emprestada
                        ? colors.warning
                        : "#10B981",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {key.isArquivado
                  ? "Arquivada (Inativa)"
                  : key.emprestada
                    ? "Emprestada"
                    : "Disponível para retirada"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Laboratório / Localização</Text>
          <Text style={styles.sectionValue}>{key.localizacao}</Text>

          <Divider style={styles.divider} />

          <Text style={styles.sectionLabel}>Descrição do Acesso</Text>
          <Text style={styles.sectionValue}>{key.descricao}</Text>
        </View>

        {key.emprestada && (
          <AppAlert
            variant="warning"
            title="Chave emprestada:"
            message={`Professor ${key.professorAtualNome ?? "não informado"}${
              key.professorAtualCracha
                ? ` · ${key.professorAtualCracha}`
                : ""
            }. Retirada por ${
              key.retiradaPorNome ?? "não informado"
            } em ${formatDate(key.retiradaEm)}.`}
          />
        )}

        <View style={styles.actionsWrapper}>
          {!key.isArquivado && !key.emprestada && (
            <AppButton
              mode="contained"
              onPress={() =>
                navigation.navigate("KeyWithdrawal", { keyId: key.id })
              }
            >
              <Feather name="log-out" size={16} /> Registrar retirada
            </AppButton>
          )}

          {key.emprestada && (
            <AppButton
              mode="contained"
              loading={loadingAcao}
              onPress={handleReturn}
            >
              <Feather name="log-in" size={16} /> Registrar devolução
            </AppButton>
          )}

          {!key.isArquivado && !key.emprestada && (
            <AppButton
              mode="contained"
              onPress={() => navigation.navigate("EditKey", { keyId: key.id })}
              style={styles.btnEditar}
            >
              <Feather name="edit-2" size={16} /> Editar Dados
            </AppButton>
          )}

          <AppButton
            mode="outlined"
            onPress={() =>
              navigation.navigate("KeyMovementHistory", { keyId: key.id })
            }
            style={[styles.btnSecondary, { borderColor: colors.primary }]}
            textColor={colors.primary}
            buttonColor={colors.white}
          >
            <Feather name="clock" size={16} /> Ver histórico
          </AppButton>

          <AppButton
            mode="outlined"
            loading={loadingAcao}
            onPress={handleArchiveToggle}
            style={[styles.btnSecondary, { borderColor: colors.primary }]}
            textColor={colors.primary}
            buttonColor={colors.white}
          >
            <Feather name={key.isArquivado ? "unlock" : "archive"} size={16} />{" "}
            {key.isArquivado ? "Reativar Chave" : "Arquivar Chave"}
          </AppButton>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Últimas movimentações</Text>
          {movements.length === 0 ? (
            <Text style={styles.sectionValue}>
              Nenhuma retirada registrada para esta chave.
            </Text>
          ) : (
            movements.slice(0, 3).map((movement) => (
              <View key={movement.id} style={styles.movementCard}>
                <View style={styles.movementHeader}>
                  <Text style={styles.movementTitle}>
                    {movement.professor.nome}
                  </Text>
                  <Text
                    style={[
                      styles.movementStatus,
                      movement.status === "EM_ABERTO" &&
                        styles.borrowedStatus,
                    ]}
                  >
                    {movement.status === "EM_ABERTO"
                      ? "Em aberto"
                      : "Devolvida"}
                  </Text>
                </View>
                <Text style={styles.movementMeta}>
                  Retirada por {movement.retiradaPor.nome} em{" "}
                  {formatDate(movement.retiradaEm)}
                </Text>
                {movement.devolvidaPor && (
                  <Text style={styles.movementMeta}>
                    Devolvida por {movement.devolvidaPor.nome} em{" "}
                    {formatDate(movement.devolvidaEm)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
