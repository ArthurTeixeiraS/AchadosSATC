import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text, ActivityIndicator, Divider } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppButton } from "../../../components/AppButton";

import {
  getKeyById,
  setKeyArchived,
} from "../../../services/keys/keyServices";
import { colors } from "../../../styles/colors";
import { Key } from "../../../types/Key";


import { styles as globalStyles } from "../KeyListScreen/styles";
import { styles } from "./styles"; 

export function KeyDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { keyId } = route.params;
  

  const [key, setKey] = useState<Key | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAcao, setLoadingAcao] = useState(false);

  async function loadKey() {
    try {
      setLoading(true);
      
      const loadedKey = await getKeyById(keyId);

      if (loadedKey) {
        setKey(loadedKey);
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
      loadKey();
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
              Alert.alert("Sucesso", `Chave ${key.isArquivado ? "reativada" : "arquivada"} com sucesso!`);
              navigation.navigate("KeyList");
            } catch (error) {
              console.log(`Erro ao ${acaoTexto} chave:`, error);
              Alert.alert("Erro", `Não foi possível ${acaoTexto} a chave.`);
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
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Buscando detalhes...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!key) return null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerCard}>
          <View style={globalStyles.cardIconWrapper}>
            <Feather name="key" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeText}>{key.codigo}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <View style={[styles.dotStatus, { backgroundColor: key.isArquivado ? "#EF4444" : "#10B981" }]} />
              <Text style={styles.statusText}>
                {key.isArquivado ? "Arquivada (Inativa)" : "Ativa no Inventário"}
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

        <View style={styles.actionsWrapper}>
          
          {!key.isArquivado && (
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
            loading={loadingAcao}
            onPress={handleArchiveToggle}
            style={[styles.btnSecondary, { borderColor: colors.primary }]}
            textColor={colors.primary}
          >
            <Feather name={key.isArquivado ? "unlock" : "archive"} size={16} />{" "}
            {key.isArquivado ? "Reativar Chave" : "Arquivar Chave"}
          </AppButton>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
