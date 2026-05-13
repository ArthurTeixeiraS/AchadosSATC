import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { PageTitle } from "../../../components/PageTitle";
import { AppCard } from "../../../components/AppCard";
import { EmptyState } from "../../../components/EmptyState";
import { Loading } from "../../../components/Loading";
import Feather from "@expo/vector-icons/Feather";

import { listResources } from "../../../services/resources/resourceServices";
import { Resource } from "../../../types/Resources";

import { styles } from "./styles";
import { AllFilters } from "../../../components/Allfilters";
import { FAB } from "react-native-paper";
import { colors } from "../../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RecursosStackParamList } from "../../../routes/RecursosStackRoutes";

export function RecursosScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RecursosStackParamList>>();

  async function loadResources() {
    try {
      setLoading(true);

      const data = await listResources();

      setResources(data);
    } catch (error) {
      console.log("Erro ao buscar recursos:", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  if (loading) {
    return <Loading message="Carregando recursos..." />;
  }

  return (
    <ScreenContainer>
      <PageTitle
        title="Recursos"
        subtitle="Gerencie ferramentas, máquinas e laboratórios."
      />

      <AppCard>
        <AllFilters filters={[ "Todos", "Disponíveis", "Em Uso", "Manutenção", "Indisponíveis"]}/>
      </AppCard>

      <AppCard>
        <AllFilters filters={[ "Todos", "Ferramenta", "Máquina", "Laboratório"]}/>
      </AppCard>

      {resources.length === 0 ? (
        <AppCard>
          <EmptyState
            icon="briefcase"
            title="Nenhum recurso cadastrado"
            message="Os recursos cadastrados aparecerão aqui."
          />
        </AppCard>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AppCard>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceNameContainer}>
                  <Text style={styles.resourceName}>{item.nome}</Text>

                  {!!item.imagemUrl && (
                    <Feather
                      name="image"
                      size={16}
                      color={colors.primary}
                      style={styles.imageIcon}
                    />
                  )}
                </View>

              <Text style={styles.resourceType}>{item.tipo}</Text>
            </View>

              {item.descricao && (
                <Text style={styles.resourceDescription}>
                  {item.descricao}
                </Text>
              )}

              <Text style={styles.resourceStatus}>
                Status: {item.status}
              </Text>
            </AppCard>
          )}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.white}
        onPress={() => navigation.navigate("CreateResource")}
      />
    </ScreenContainer>
  );
}