import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text, ActivityIndicator, Divider } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppButton } from "../../../components/AppButton";

import {
  listarChaves,
  alternarArquivamentoChave,
  Chave,
} from "../../../services/chave/chaveServices";
import { colors } from "../../../styles/colors";


import { styles as globalStyles } from "../KeysListScreen/styles"; 
import { styles } from "./styles"; 

export function KeyDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chaveId } = route.params;
  

  const [chave, setChave] = useState<Chave | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAcao, setLoadingAcao] = useState(false);

  async function carregarDadosChave() {
    try {
      setLoading(true);
      
      const listaAtivas = await listarChaves(false) as Chave[];
      let chaveEncontrada = listaAtivas.find((c) => c.id === chaveId);

      if (!chaveEncontrada) {
        const listaArquivadas = await listarChaves(true) as Chave[];
        chaveEncontrada = listaArquivadas.find((c) => c.id === chaveId);
      }

      if (chaveEncontrada) {
        setChave(chaveEncontrada);
      } else {
        Alert.alert("Erro", "Chave não encontrada no sistema.");
        navigation.goBack();
      }
    } catch (error) {
      console.log("Erro ao carregar detalhes da chave:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes da chave.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      carregarDadosChave();
    });

    return unsubscribe;
  }, [navigation, chaveId]);

  async function handleAlternarArquivamento() {
    if (!chave) return;
    
    const acaoTexto = chave.isArquivado ? "reativar" : "arquivar";

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
              await alternarArquivamentoChave(chave.id, !chave.isArquivado);
              Alert.alert("Sucesso", `Chave ${chave.isArquivado ? "reativada" : "arquivada"} com sucesso!`);
              navigation.goBack(); 
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

  if (!chave) return null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerCard}>
          <View style={globalStyles.cardIconWrapper}>
            <Feather name="key" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeText}>{chave.codigo}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <View style={[styles.dotStatus, { backgroundColor: chave.isArquivado ? "#EF4444" : "#10B981" }]} />
              <Text style={styles.statusText}>
                {chave.isArquivado ? "Arquivada (Inativa)" : "Ativa no Inventário"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Laboratório / Localização</Text>
          <Text style={styles.sectionValue}>{chave.localizacao}</Text>

          <Divider style={styles.divider} />

          <Text style={styles.sectionLabel}>Descrição do Acesso</Text>
          <Text style={styles.sectionValue}>{chave.descricao}</Text>
        </View>

        <View style={styles.actionsWrapper}>
          
          {!chave.isArquivado && (
            <AppButton
              mode="contained"
              onPress={() => navigation.navigate("KeyEdit", { chaveId: chave.id })}
              style={styles.btnEditar}
            >
              <Feather name="edit-2" size={16} /> Editar Dados
            </AppButton>
          )}

          <AppButton
            mode="outlined"
            loading={loadingAcao}
            onPress={handleAlternarArquivamento}
            style={[styles.btnSecondary, { borderColor: colors.primary }]}
            textColor={colors.primary}
          >
            <Feather name={chave.isArquivado ? "unlock" : "archive"} size={16} />{" "}
            {chave.isArquivado ? "Reativar Chave" : "Arquivar Chave"}
          </AppButton>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
