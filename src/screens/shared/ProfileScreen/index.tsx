import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { useAuth } from "../../../contexts/AuthContext";
import { AppButton } from "../../../components/AppButton";
import { ScreenContainer } from "../../../components/ScreenContainer";

import { styles } from "./styles";

export function ProfileScreen() {
  const { appUser, logout } = useAuth();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {appUser?.nomeCompleto?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{appUser?.nomeCompleto}</Text>
        <Text style={styles.role}>
          {appUser?.tipoUsuario === "FUNCIONARIO" ? "Funcionário" : "Professor"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados do usuário</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Crachá</Text>
          <Text style={styles.infoValue}>{appUser?.cracha}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>E-mail institucional</Text>
          <Text style={styles.infoValue}>{appUser?.emailInstitucional}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status da conta</Text>
          <Text style={styles.statusActive}>{appUser?.statusConta}</Text>
        </View>

        {appUser?.telefone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{appUser.telefone}</Text>
          </View>
        )}
      </View>

      <AppButton onPress={logout}>Sair da conta</AppButton>
    </ScreenContainer>
  );
}