import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";

import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { SolicitacoesAdminScreen } from "../screens/admin/SolicitacoesAdminScreen";
import { RecursosScreen } from "../screens/admin/RecursosScreen";
import { ChavesScreen } from "../screens/admin/ChavesScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";

import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator();

export function AdminRoutes() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
        component={SolicitacoesAdminScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="file" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Recursos"
        component={RecursosScreen}
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
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}