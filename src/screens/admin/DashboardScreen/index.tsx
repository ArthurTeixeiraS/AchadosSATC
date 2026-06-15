import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

import { ScreenContainer } from "../../../components/ScreenContainer";
import { useAuth } from "../../../contexts/AuthContext";
import {
  DashboardStats,
  getDashboardStats,
  subscribeDashboardStats,
} from "../../../services/solicitations/solicitationServices";
import { useManualRefresh } from "../../../hooks/useManualRefresh";
import { colors } from "../../../styles/colors";
import { styles } from "./styles";

export function DashboardScreen() {
  const { appUser } = useAuth();
  const navigation = useNavigation<any>();

  const primeiroNome = appUser?.nomeCompleto?.split(" ")[0] ?? "Admin";

  const [pendentes, setPendentes] = useState(0);
  const [novas, setNovas] = useState(0);
  const [encerradas, setEncerradas] = useState(0);

  function updateStats(stats: DashboardStats) {
    setPendentes(stats.pendentes);
    setNovas(stats.novas);
    setEncerradas(stats.encerradas);
  }

  useEffect(() => {
    const unsubscribe = subscribeDashboardStats(updateStats);

    return unsubscribe;
  }, []);

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: async () => {
      const stats = await getDashboardStats();
      updateStats(stats);
    },
    errorMessage:
      "Não foi possível atualizar os dados do dashboard. Tente novamente.",
  });

  function irPara(aba: string) {
    navigation.navigate(aba);
  }

  function irParaDevolucoes() {
    navigation.navigate("Solicitações", {
      screen: "ReceivedSolicitations",
      params: {
        initialStatus: "EM_USO",
      },
    });
  }

  function emBreve() {
    Alert.alert("Em breve", "Esta funcionalidade ainda não está disponível.");
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.greeting}>Olá, Ferramenteiro</Text>
          <Text style={styles.userName}>{primeiroNome}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => irPara("Solicitações")}
        >
          <Feather name="clock" size={22} color="#F59E0B" />
          <Text style={styles.statNumber}>{pendentes}</Text>
          <Text style={styles.statLabel}>Pendente{"\n"}aprovação do funcionario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => irPara("Solicitações")}
        >
          <Feather name="briefcase" size={22} color="#065F31" />
          <Text style={styles.statNumber}>{novas}</Text>
          <Text style={styles.statLabel}>Novas{"\n"}solicitações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => irPara("Solicitações")}
        >
          <Feather name="check-circle" size={22} color="#1D8C4F" />
          <Text style={styles.statNumber}>{encerradas}</Text>
          <Text style={styles.statLabel}>Encerradas</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Gerenciamento</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => irPara("Solicitações")}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="clipboard" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Solicitações</Text>
          <Text style={styles.menuSubtitle}>
            Solicitações de empréstimo do sistema
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => irPara("Recursos")}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="box" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Recursos</Text>
          <Text style={styles.menuSubtitle}>Controle de ferramentas</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => irPara("Consultas")}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="search" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Consultas</Text>
          <Text style={styles.menuSubtitle}>
            Recursos alocados e histórico de solicitações
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={irParaDevolucoes}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="corner-down-left" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Registrar devoluções</Text>
          <Text style={styles.menuSubtitle}>
            Solicitações com recursos em uso
          </Text>
        </View>
      </TouchableOpacity>

    
      {appUser?.tipoUsuario === "FUNCIONARIO" && (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => irPara("Chaves")} // Mudado de "KeysStackRoutes" para "Chaves"
        >
          <View style={styles.menuIconWrapper}>
            <Feather name="key" size={20} color="#fff" />
          </View>
          <View style={styles.menuTextWrapper}>
            <Text style={styles.menuTitle}>Chaves</Text>
            <Text style={styles.menuSubtitle}>Controle de acesso aos labs</Text>
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={emBreve}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="tool" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Ocorrências</Text>
          <Text style={styles.menuSubtitle}>Problemas reportados</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => irPara("Relatórios")}
      >
        <View style={styles.menuIconWrapper}>
          <Feather name="bar-chart-2" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Relatórios</Text>
          <Text style={styles.menuSubtitle}>Auditoria de operações</Text>
        </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
