import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator } from "react-native-paper";

import { useAuth } from "../contexts/AuthContext";
import { AuthRoutes } from "./AuthRoutes";
import { AdminRoutes } from "./AdminRoutes";
import { ProfessorRoutes } from "./ProfessorRoutes";

export function AppRoutes() {
  // Aqui é onde é decido qual o conjunto de telas será apresentado ao usuário, baseado no estado de autenticação e tipo de usuário
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!appUser ? (
        <AuthRoutes />
      ) : appUser.tipoUsuario === "FUNCIONARIO" ? (
        <AdminRoutes />
      ) : (
        <ProfessorRoutes />
      )}
    </NavigationContainer>
  );
}