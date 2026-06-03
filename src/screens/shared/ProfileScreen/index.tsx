import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAuth } from "../../../contexts/AuthContext";
import { AppButton } from "../../../components/AppButton";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { ProfileStackParamList } from "../../../routes/ProfileStackRoutes";

import { styles } from "./styles";

type NavProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export function ProfileScreen() {
  const { appUser, logout } = useAuth();
  const navigation = useNavigation<NavProp>();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {appUser?.nomeCompleto?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{appUser?.nomeCompleto}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Feather name="edit-2" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.role}>
          {appUser?.tipoUsuario === "FUNCIONARIO" ? "Funcionário" : "Professor"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados do usuário</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Matrícula</Text>
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