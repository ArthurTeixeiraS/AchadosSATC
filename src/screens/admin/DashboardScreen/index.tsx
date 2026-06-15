import React, { useEffect, useState } from "react";
import {
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

  const primeiroNome = appUser?.nomeCompleto?.split(" ")[0] ?? "Ferramenteiro";

  const [stats, setStats] = useState<DashboardStats>({
    pendentes: 0,
    novas: 0,
    encerradas: 0,
    emUso: 0,
    atrasadas: 0,
  });

  function updateStats(data: DashboardStats) {
    setStats(data);
  }

  useEffect(() => {
    const unsubscribe = subscribeDashboardStats((data) => {
      updateStats(data);
    });

    return unsubscribe;
  }, []);

  const { refreshing, refresh } = useManualRefresh({
    onRefresh: async () => {
      const data = await getDashboardStats();
      updateStats(data);
    },
    errorMessage:
      "Não foi possível atualizar os dados do dashboard. Tente novamente.",
  });

  function irPara(aba: string) {
    navigation.navigate(aba);
  }

  function irParaSolicitacoesFiltradas(status: string) {
    navigation.navigate("Solicitações", {
      screen: "ReceivedSolicitations",
      params: {
        initialStatus: status,
      },
    });
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
            onPress={() => irParaSolicitacoesFiltradas("PENDENTE")}
          >
            <Feather name="clock" size={22} color={colors.warning} />
            <Text style={styles.statNumber}>{stats.pendentes}</Text>
            <Text style={styles.statLabel}>Aguardando{"\n"}análise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => irParaSolicitacoesFiltradas("EM_USO")}
          >
            <Feather
              name="package"
              size={22}
              color={stats.atrasadas > 0 ? colors.error : colors.primary}
            />
            <Text
              style={[
                styles.statNumber,
                stats.atrasadas > 0 && styles.statNumberRed,
              ]}
            >
              {stats.emUso}
            </Text>
            <Text style={styles.statLabel}>Em uso{"\n"}/ Atrasadas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => irParaSolicitacoesFiltradas("ENCERRADA")}
          >
            <Feather name="check-circle" size={22} color={colors.greenMedium} />
            <Text style={styles.statNumber}>{stats.encerradas}</Text>
            <Text style={styles.statLabel}>Encerradas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.shortcutsTitle}>Acesso rápido</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Solicitações")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="clipboard" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Solicitações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Recursos")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="box" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Recursos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irParaSolicitacoesFiltradas("EM_USO")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="corner-down-left" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Devoluções</Text>
          </TouchableOpacity>

          {appUser?.tipoUsuario === "FUNCIONARIO" && (
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => irPara("Chaves")}
            >
              <View style={styles.shortcutIcon}>
                <Feather name="key" size={20} color="#fff" />
              </View>
              <Text style={styles.shortcutLabel}>Chaves</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => irPara("Ocorrências")}
          >
            <View style={styles.shortcutIcon}>
              <Feather name="tool" size={20} color="#fff" />
            </View>
            <Text style={styles.shortcutLabel}>Ocorrências</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
