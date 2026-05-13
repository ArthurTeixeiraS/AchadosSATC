import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";

import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { SolicitacoesAdminScreen } from "../screens/admin/SolicitacoesAdminScreen";
import { RecursosStackRoutes } from "./RecursosStackRoutes";
import { ChavesScreen } from "../screens/admin/ChavesScreen";
import { ProfileScreen } from "../screens/shared/ProfileScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

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
        component={SolicitacoesAdminScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="file" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Recursos"
        component={RecursosStackRoutes}
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