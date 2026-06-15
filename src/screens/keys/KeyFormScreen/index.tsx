import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Text, TextInput, ActivityIndicator } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { AppButton } from "../../../components/AppButton";


import { cadastrarChave, editarChave, listarChaves } from "../../../services/chave/chaveServices";
import { colors } from "../../../styles/colors";
import { styles } from "../KeysListScreen/styles"; 

export function KeyFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  

  const chaveId = route.params?.chaveId;
  const isEdicao = !!chaveId; 


  const [codigo, setCodigo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [descricao, setDescricao] = useState("");
  
  
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  
  useEffect(() => {
    if (isEdicao) {
      async function carregarDadosChave() {
        try {
          setLoadingDados(true);
          
          const listaAtivas = await listarChaves(false);
          let chaveEncontrada = listaAtivas.find((c) => c.id === chaveId);
          
        
          if (!chaveEncontrada) {
            const listaArquivadas = await listarChaves(true);
            chaveEncontrada = listaArquivadas.find((c) => c.id === chaveId);
          }

          if (chaveEncontrada) {
            setCodigo(chaveEncontrada.codigo);
            setLocalizacao(chaveEncontrada.localizacao);
            setDescricao(chaveEncontrada.descricao);
          } else {
            Alert.alert("Erro", "Chave não encontrada.");
            navigation.goBack();
          }
        } catch (error) {
          console.log("Erro ao carregar chave para edição:", error);
          Alert.alert("Erro", "Não foi possível carregar os dados da chave.");
        } finally {
          setLoadingDados(false);
        }
      }
      carregarDadosChave();
    }
  }, [isEdicao, chaveId]);

 
  async function handleSalvar() {

    if (!codigo.trim() || !localizacao.trim() || !descricao.trim()) {
      Alert.alert("Atenção", "Todos os campos são obrigatórios.");
      return;
    }

    try {
      setLoadingSalvar(true);

      if (isEdicao) {
        
        await editarChave(chaveId, {
          descricao: descricao.trim(),
          localizacao: localizacao.trim(),
        });
        Alert.alert("Sucesso", "Chave atualizada com sucesso!");
      } else {
        
        await cadastrarChave({
          codigo: codigo.trim(),
          descricao: descricao.trim(),
          localizacao: localizacao.trim(),
        });
        Alert.alert("Sucesso", "Chave cadastrada com sucesso!");
      }

      navigation.goBack(); 
    } catch (error: any) {
      console.log("Erro ao salvar chave:", error);
      
      
      if (error.message === "DUPLICATE_CODE") {
        Alert.alert("Erro", "Este código de chave já está cadastrado.");
      } else {
        Alert.alert("Erro", "Ocorreu um erro ao salvar a chave. Tente novamente.");
      }
    } finally {
      setLoadingSalvar(false);
    }
  }


  if (loadingDados) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Buscando dados da chave...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        
        
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>
            Código de Identificação
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: LAB-101, CHAVE-01"
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            editable={!isEdicao} 
            textColor={isEdicao ? "#6B7280" : undefined}
            outlineColor="#E5E7EB"
            activeOutlineColor={colors.primary}
            style={{ backgroundColor: isEdicao ? "#F3F4F6" : "#FFF" }}
            right={isEdicao ? <TextInput.Icon icon={() => <Feather name="lock" size={16} color="#9CA3AF" />} /> : undefined}
          />
          {isEdicao && (
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
              O código identificador não pode ser alterado após o cadastro.
            </Text>
          )}
        </View>

       
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>
            Localização / Laboratório
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: Bloco XXI - Sala 04"
            value={localizacao}
            onChangeText={setLocalizacao}
            outlineColor="#E5E7EB"
            activeOutlineColor={colors.primary}
            style={{ backgroundColor: "#FFF" }}
          />
        </View>

       
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>
            Descrição
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: Abre o armário de ferramentas e racks do bloco"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={4}
            outlineColor="#E5E7EB"
            activeOutlineColor={colors.primary}
            style={{ backgroundColor: "#FFF", minHeight: 80 }}
          />
        </View>

       
        <View style={{ marginTop: 12 }}>
          <AppButton loading={loadingSalvar} onPress={handleSalvar}>
            {isEdicao ? "Salvar Alterações" : "Cadastrar Chave"}
          </AppButton>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}
