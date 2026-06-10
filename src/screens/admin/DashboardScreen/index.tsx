import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../../../contexts/AuthContext";
import { getDashboardStats } from "../../../services/solicitations/solicitationServices";
import { styles } from "./styles";

export function DashboardScreen() {
  const { appUser } = useAuth();
  const navigation = useNavigation<any>();

  const primeiroNome = appUser?.nomeCompleto?.split(" ")[0] ?? "Admin";

  const [pendentes, setPendentes] = useState(0);
  const [novas, setNovas] = useState(0);
  const [encerradas, setEncerradas] = useState(0);

  useEffect(() => {
    getDashboardStats().then((stats) => {
      setPendentes(stats.pendentes);
      setNovas(stats.novas);
      setEncerradas(stats.encerradas);
    });
  }, []);

  function irPara(aba: string) {
    navigation.navigate(aba);
  }

  function emBreve() {
    Alert.alert("Em breve", "Esta funcionalidade ainda não está disponível.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <TouchableOpacity style={styles.statCard} onPress={() => irPara("Solicitações")}>
          <Feather name="clock" size={22} color="#F59E0B" />
          <Text style={styles.statNumber}>{pendentes}</Text>
          <Text style={styles.statLabel}>Solicitações{"\n"}pendentes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => irPara("Solicitações")}>
          <Feather name="briefcase" size={22} color="#065F31" />
          <Text style={styles.statNumber}>{novas}</Text>
          <Text style={styles.statLabel}>Novas{"\n"}solicitações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => irPara("Solicitações")}>
          <Feather name="check-circle" size={22} color="#1D8C4F" />
          <Text style={styles.statNumber}>{encerradas}</Text>
          <Text style={styles.statLabel}>Encerradas</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Gerenciamento</Text>

      <TouchableOpacity style={styles.menuItem} onPress={() => irPara("Solicitações")}>
        <View style={styles.menuIconWrapper}>
          <Feather name="clipboard" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Solicitações</Text>
          <Text style={styles.menuSubtitle}>Solicitações de empréstimo do sistema</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => irPara("Recursos")}>
        <View style={styles.menuIconWrapper}>
          <Feather name="box" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Recursos</Text>
          <Text style={styles.menuSubtitle}>Controle de ferramentas</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => irPara("Chaves")}>
        <View style={styles.menuIconWrapper}>
          <Feather name="key" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Chaves</Text>
          <Text style={styles.menuSubtitle}>Controle de acesso aos labs</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={emBreve}>
        <View style={styles.menuIconWrapper}>
          <Feather name="tool" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Ocorrências</Text>
          <Text style={styles.menuSubtitle}>Problemas reportados</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={emBreve}>
        <View style={styles.menuIconWrapper}>
          <Feather name="bar-chart-2" size={20} color="#fff" />
        </View>
        <View style={styles.menuTextWrapper}>
          <Text style={styles.menuTitle}>Relatórios</Text>
          <Text style={styles.menuSubtitle}>Estatísticas e métricas</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}