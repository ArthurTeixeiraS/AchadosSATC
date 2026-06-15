import React, { useState, useEffect } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text, TextInput, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppButton } from "../../../components/AppButton";

import { listarChaves, Chave } from "../../../services/chave/chaveServices";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

export function KeysListScreen() {
  const navigation = useNavigation<any>();

  // Estados
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busca, setBusca] = useState("");
  const [abaArquivadas, setAbaArquivadas] = useState(false); // false = Ativas, true = Arquivadas

  // Função principal de carregamento
  async function carregarChaves() {
    try {
      setLoading(true);
      setError(false);
      
      const dados = await listarChaves(abaArquivadas) as Chave[];
      setChaves(dados); 
    } catch (err) {
      console.log("Erro ao listar chaves na tela:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // APENAS OS DOIS EFEITOS CORRETOS ABAIXO:
  // ==========================================

  // 1. Sempre que você clicar e trocar de aba manualmente, ele busca o banco atualizado
  useEffect(() => {
    carregarChaves();
  }, [abaArquivadas]);

  // 2. Sempre que você voltar para esta tela (via goBack), ele atualiza mantendo a MESMA aba
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      carregarChaves();
    });

    return unsubscribe;
  }, [navigation, abaArquivadas]); // Escuta o foco casado com a aba atual

  // ==========================================

  const chavesFiltradas = chaves.filter((chave) => {
    const termo = busca.toLowerCase();
    return (
      chave.codigo?.toLowerCase().includes(termo) ||
      chave.localizacao?.toLowerCase().includes(termo)
    );
  });

  const renderItem = ({ item }: { item: Chave }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("KeyDetails", { chaveId: item.id })}
    >
      <View style={styles.cardIconWrapper}>
        <Feather name="key" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.codigo}</Text>
        <Text style={styles.cardSubtitle}>{item.localizacao}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        
       
        <View style={styles.searchRow}>
          <TextInput
            mode="outlined"
            placeholder="Buscar por código ou laboratório..."
            value={busca}
            onChangeText={setBusca}
            style={styles.searchBar}
            outlineColor="#E5E7EB"
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon={() => <Feather name="search" size={18} color="#6B7280" />} />}
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate("KeyCreate")}
          >
            <Feather name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, !abaArquivadas && styles.tabActive]}
            onPress={() => setAbaArquivadas(false)}
          >
            <Feather name="lock" size={16} color={!abaArquivadas ? colors.primary : "#374151"} />
            <Text style={[styles.tabText, !abaArquivadas && styles.tabTextActive]}>Ativas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, abaArquivadas && styles.tabActive]}
            onPress={() => setAbaArquivadas(true)}
          >
            <Feather name="archive" size={16} color={abaArquivadas ? colors.primary : "#374151"} />
            <Text style={[styles.tabText, abaArquivadas && styles.tabTextActive]}>Arquivadas</Text>
          </TouchableOpacity>
        </View>

        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Erro ao carregar o inventário.</Text>
            <AppButton onPress={carregarChaves} style={{ marginTop: 12 }}>Tentar Novamente</AppButton>
          </View>
        ) : chavesFiltradas.length === 0 ? (
          <View style={styles.centerContainer}>
            <Feather name="inbox" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Nenhuma chave encontrada nesta categoria.</Text>
          </View>
        ) : (
          <FlatList
            data={chavesFiltradas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}

      </View>
    </ScreenContainer>
  );
}