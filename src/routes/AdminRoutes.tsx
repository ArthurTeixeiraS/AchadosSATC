import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";

import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { ResourceStackRoutes } from "./ResourceStackRoutes";
import { ChavesScreen } from "../screens/admin/ChavesScreen";
import { ProfileStackRoutes } from "./ProfileStackRoutes";

import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import { FuncionarioSolicitacaoStackRoutes } from "./FuncionarioSolicitacaoStackRoutes";

const Tab = createBottomTabNavigator();

export function AdminRoutes() {
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
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="menu" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Solicitações"
        component={FuncionarioSolicitacaoStackRoutes}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="file" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Recursos"
        component={ResourceStackRoutes}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Chaves"
        component={ChavesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="key" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileStackRoutes}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}