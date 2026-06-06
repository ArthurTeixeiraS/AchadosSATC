import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ProfessorHomeScreen } from "../screens/professor/ProfessorHomeScreen/ProfessorHomeScreen";
import { NovaSolicitacaoStackRoutes } from "./NovaSolicitacaoStackRoutes";
import { OcorrenciasScreen } from "../screens/professor/OcorrenciasScreen";
import { ProfileStackRoutes } from "./ProfileStackRoutes";
import { colors } from "../styles/colors";
import Feather from '@expo/vector-icons/Feather';
import { typography } from "../styles/typography";
import { SolicitationDraftProvider } from "../contexts/SolicitationDraftContext";
import { MinhasSolicitacoesStackRoutes } from "./MinhasSolicitacoesStackRoutes";

const Tab = createBottomTabNavigator();

function NovaSolicitacaoFlow() {
  return (
    <SolicitationDraftProvider>
      <NovaSolicitacaoStackRoutes />
    </SolicitationDraftProvider>
  );
}

//Módulo exclusivo para rotas de professores
export function ProfessorRoutes() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: typography.fontFamily.medium,
        },

        headerStyle: {
          backgroundColor: colors.primary,
        },

        headerTintColor: colors.white,

        headerTitleStyle: {
          fontFamily: typography.fontFamily.bold,
        },
      }}
    >
      <Tab.Screen name="Home" component={ProfessorHomeScreen} options={{
        tabBarIcon: ({ color, size }) => (
          <Feather name="home" size={size} color={color} />
        ),
      }} />
      <Tab.Screen name="Nova Solicitação" component={NovaSolicitacaoFlow} options={{
        tabBarIcon: ({ color, size }) => (
          <Feather name="plus" size={size} color={color} />
        ),
      }} />
      <Tab.Screen name="Minhas Solicitações" component={MinhasSolicitacoesStackRoutes} options={{
        tabBarIcon: ({ color, size }) => (
          <Feather name="file" size={size} color={color} />
        ),
      }} />
      <Tab.Screen name="Ocorrências" component={OcorrenciasScreen} options={{
        tabBarIcon: ({ color, size }) => (
          <Feather name="tool" size={size} color={color} />
        ),
      }} />
      <Tab.Screen name="Perfil" component={ProfileStackRoutes} options={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Feather name="user" size={size} color={color} />
        ),
      }} />
    </Tab.Navigator>
  );
}