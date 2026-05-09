import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

import { useAuth } from "../../../contexts/AuthContext";
import { AppButton } from "../../../components/AppButton";

export function AdminHomeScreen() {
  const { appUser, logout } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text variant="headlineMedium">Dashboard Funcionário</Text>
      <Text>Olá, {appUser?.nomeCompleto}</Text>

      <AppButton mode="contained" onPress={logout} style={{ marginTop: 24 }}>
        Sair
      </AppButton>
    </View>
  );
}