import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "react-native-paper";

import { AppAlert } from "../../../components/AppAlert";
import { AppButton } from "../../../components/AppButton";
import { AppCard } from "../../../components/AppCard";
import { AppInput } from "../../../components/AppInput";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getKeyById,
  listProfessors,
  withdrawKey,
} from "../../../services/keys/keyServices";
import { Key, KeyMovementActor } from "../../../types/Key";
import { colors } from "../../../styles/colors";
import { normalizeFilterText } from "../../../components/AppListFilter";
import { styles } from "../KeyDetailsScreen/styles";
import { styles as listStyles } from "../KeyListScreen/styles";

export function KeyWithdrawalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { appUser } = useAuth();
  const keyId = route.params?.keyId;

  const [key, setKey] = useState<Key | null>(null);
  const [professors, setProfessors] = useState<KeyMovementActor[]>([]);
  const [selectedProfessor, setSelectedProfessor] =
    useState<KeyMovementActor | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          const [loadedKey, loadedProfessors] = await Promise.all([
            getKeyById(keyId),
            listProfessors(),
          ]);

          if (active) {
            setKey(loadedKey);
            setProfessors(loadedProfessors);
            setError(null);
          }
        } catch (loadError) {
          console.log("Erro ao preparar retirada de chave:", loadError);
          if (active) {
            setError("Não foi possível carregar os dados para retirada.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [keyId])
  );

  const filteredProfessors = useMemo(() => {
    const normalized = normalizeFilterText(search);
    if (!normalized) return professors;

    return professors.filter((professor) =>
      [professor.nome, professor.cracha].some((value) =>
        normalizeFilterText(value).includes(normalized)
      )
    );
  }, [professors, search]);

  async function handleWithdraw() {
    if (!appUser || !key || !selectedProfessor) {
      setError("Selecione o professor responsável pela retirada.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await withdrawKey(key.id, selectedProfessor, appUser);
      Alert.alert("Sucesso", "Retirada registrada com sucesso.");
      navigation.navigate("KeyDetails", { keyId: key.id });
    } catch (withdrawError: any) {
      console.log("Erro ao registrar retirada de chave:", withdrawError);
      const messages: Record<string, string> = {
        KEY_ARCHIVED: "Chaves arquivadas não podem ser retiradas.",
        KEY_ALREADY_BORROWED: "Esta chave já está emprestada.",
        KEY_NOT_FOUND: "Chave não encontrada.",
      };
      setError(
        messages[withdrawError?.message] ||
          "Não foi possível registrar a retirada."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando retirada..." />;
  }

  return (
    <ScreenContainer>
      <FlatList
        data={filteredProfessors}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {!!error && <AppAlert variant="error" message={error} />}

            {key ? (
              <AppCard>
                <View style={listStyles.cardContent}>
                  <View style={listStyles.cardIconWrapper}>
                    <Feather name="key" size={20} color={colors.primary} />
                  </View>
                  <View style={listStyles.cardText}>
                    <Text style={listStyles.cardTitle}>{key.codigo}</Text>
                    <Text style={listStyles.cardSubtitle}>
                      {key.localizacao}
                    </Text>
                    <Text style={listStyles.cardDescription}>
                      {key.emprestada
                        ? "Esta chave já está emprestada."
                        : "Selecione o professor responsável."}
                    </Text>
                  </View>
                </View>
              </AppCard>
            ) : (
              <AppAlert variant="error" message="Chave não encontrada." />
            )}

            <AppInput
              value={search}
              onChangeText={setSearch}
              label="Professor"
              placeholder="Buscar por nome ou crachá"
            />
          </View>
        }
        ListEmptyComponent={
          <AppCard>
            <EmptyState
              icon="user"
              title="Nenhum professor encontrado"
              message="Revise a busca ou o cadastro de usuários ativos."
            />
          </AppCard>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedProfessor(item)}>
            <View
              style={[
                styles.movementCard,
                selectedProfessor?.id === item.id && styles.selectedCard,
              ]}
            >
              <Text style={styles.movementTitle}>{item.nome}</Text>
              <Text style={styles.movementSubtitle}>
                Crachá: {item.cracha ?? "Não informado"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <AppButton
            loading={saving}
            disabled={!key || key.emprestada || key.isArquivado}
            onPress={handleWithdraw}
          >
            Confirmar retirada
          </AppButton>
        }
      />
    </ScreenContainer>
  );
}
