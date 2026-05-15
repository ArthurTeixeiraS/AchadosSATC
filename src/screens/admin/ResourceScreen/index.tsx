import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
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
import { ResourceStackParamList } from "../../../routes/ResourceStackRoutes";

// Seria interessante exibir os laboratórios aos quais as máquinas estão associadas

export function ResourceScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const navigation = useNavigation<NativeStackNavigationProp<ResourceStackParamList>>();

  const statusFilters = ["Todos", "Disponíveis", "Em Uso", "Manutenção"];
  const typeFilters = ["Todos", "Ferramenta", "Máquina", "Laboratório"];

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

  const filteredResources = resources.filter((resource) => {
    const matchesStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Disponíveis" && resource.status === "DISPONIVEL") ||
      (statusFilter === "Em Uso" && resource.status === "EM_USO") ||
      (statusFilter === "Manutenção" && resource.status === "MANUTENCAO");

    const matchesType =
      typeFilter === "Todos" ||
      (typeFilter === "Ferramenta" && resource.tipo === "FERRAMENTA") ||
      (typeFilter === "Máquina" && resource.tipo === "MAQUINA") ||
      (typeFilter === "Laboratório" && resource.tipo === "LABORATORIO");

    return matchesStatus && matchesType;
  });

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      DISPONIVEL: "Disponível",
      EM_USO: "Em uso",
      MANUTENCAO: "Manutenção",
    };

    return labels[status] ?? status;
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      FERRAMENTA: "Ferramenta",
      MAQUINA: "Máquina",
      LABORATORIO: "Laboratório",
    };

    return labels[type] ?? type;
  }

  return (
    <ScreenContainer>
      <PageTitle
        title="Recursos"
        subtitle="Gerencie ferramentas, máquinas e laboratórios."
      />

      <AppCard>
        <AllFilters
          filters={statusFilters}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
        />
      </AppCard>

      <AppCard>
        <AllFilters
          filters={typeFilters}
          selectedFilter={typeFilter}
          onSelectFilter={setTypeFilter}
        />
      </AppCard>

      {resources.length === 0 ? (
        <AppCard>
          <EmptyState
            icon="briefcase"
            title="Nenhum recurso cadastrado"
            message="Cadastre ferramentas, máquinas ou laboratórios para começar."
          />
        </AppCard>
      ) : filteredResources.length === 0 ? (
        <AppCard>
          <EmptyState
            icon="briefcase"
            title="Nenhum recurso cadastrado"
            message="Os recursos cadastrados aparecerão aqui."
          />
        </AppCard>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AppCard>
              <View style={styles.cardContent}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceNameContainer}>

                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ResourceDetails", {
                          resource: item,
                        })
                      }
                    >
                      <Text style={styles.resourceName}>{item.nome}</Text>
                    </TouchableOpacity>   
                    {!!item.imagemUrl && (
                      <Feather
                        name="image"
                        size={16}
                        color={colors.primary}
                        style={styles.imageIcon}
                      />
                    )}
                  </View>

                  <Text style={styles.resourceType}>{getTypeLabel(item.tipo)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.resourceActions}
                  onPress={() =>
                    navigation.navigate("EditResource", {
                      resource: item,
                    })
                  }
                >
                  <View style={styles.editButton}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                {item.descricao && (
                  <Text style={styles.resourceDescription}>{item.descricao}</Text>
                )}

                <Text style={styles.resourceStatus}>Status: {getStatusLabel(item.status)}</Text>
              </View>
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